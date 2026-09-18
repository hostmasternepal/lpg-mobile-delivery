import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RequestIntakeService } from '../request-intake/request-intake.service';
import { AdjustVehicleLoadDto } from './dto/adjust-vehicle-load.dto';
import { AssignStopDto } from './dto/assign-stop.dto';
import { AssignVehicleDto } from './dto/assign-vehicle.dto';
import { CreateAgentProfileDto } from './dto/create-agent-profile.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { RescheduleStopDto } from './dto/reschedule-stop.dto';
import { SequenceStopsDto } from './dto/sequence-stops.dto';
import { DeliveryStopStatus, getValidStopPredecessors } from './delivery-stop-state-machine';

const TERMINAL_STOP_STATUSES: DeliveryStopStatus[] = ['CONFIRMED', 'FAILED', 'CANCELLED'];

@Injectable()
export class DeliveryPlanningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestIntake: RequestIntakeService,
    private readonly events: EventEmitter2,
  ) {}

  // ---------------------------------------------------------------------
  // Delivery queue (REQ-020/021) — thin wrappers around
  // RequestIntakeService.transition(); this service never writes
  // requests.status itself.
  // ---------------------------------------------------------------------

  async shortlistRequest(requestId: string, actorId: string, expectedVersion: number) {
    return this.requestIntake.transition(requestId, 'SHORTLISTED', actorId, expectedVersion);
  }

  async queueRequest(requestId: string, actorId: string, expectedVersion: number) {
    return this.requestIntake.transition(requestId, 'DELIVERY_QUEUE', actorId, expectedVersion);
  }

  /**
   * The delivery queue itself is a VIEW, not a table (docs/
   * ARCHITECTURE_REVIEW.md §D). Ordering here is FIFO by creation time —
   * a neutral placeholder, not a resolution of OPEN-BUSINESS-DECISION-08
   * (priority scoring) or -42 (priority-vs-route trade-off). Whichever
   * ordering is eventually ratified replaces this `orderBy`, not the
   * shape of this method.
   */
  async getQueue() {
    return this.prisma.request.findMany({
      where: { status: 'DELIVERY_QUEUE' },
      include: { beneficiary: true, priorityGroups: { include: { priorityGroup: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ---------------------------------------------------------------------
  // Fleet: vehicles and agent profiles
  // ---------------------------------------------------------------------

  async createVehicle(dto: CreateVehicleDto) {
    return this.prisma.vehicle.create({ data: dto });
  }

  async listVehicles() {
    return this.prisma.vehicle.findMany({ orderBy: { identifier: 'asc' } });
  }

  async createAgentProfile(dto: CreateAgentProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException(`User ${dto.userId} not found.`);
    }
    return this.prisma.agentProfile.create({ data: dto });
  }

  async listAgentProfiles() {
    return this.prisma.agentProfile.findMany({
      include: { user: { select: { id: true, fullName: true, phoneOrUsername: true } } },
    });
  }

  // ---------------------------------------------------------------------
  // Delivery plans and vehicle/load allocation
  // ---------------------------------------------------------------------

  /**
   * ARCH-DECISION-15: safe to re-run for the same date without creating a
   * duplicate plan — relies on delivery_plans.planDate's UNIQUE
   * constraint, catching the race rather than pre-checking-then-creating
   * (which would itself be a TOCTOU gap under real concurrency).
   */
  async generatePlan(dto: GeneratePlanDto, actorId: string) {
    const planDate = new Date(dto.planDate);
    try {
      const plan = await this.prisma.deliveryPlan.create({ data: { planDate, status: 'DRAFT' } });
      this.events.emit('delivery.plan_created', {
        planId: plan.id,
        actorId,
        afterState: plan,
        occurredAt: new Date(),
      });
      return plan;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return this.prisma.deliveryPlan.findUniqueOrThrow({ where: { planDate } });
      }
      throw err;
    }
  }

  async listPlans() {
    return this.prisma.deliveryPlan.findMany({ orderBy: { planDate: 'desc' } });
  }

  async getPlan(planId: string) {
    const plan = await this.prisma.deliveryPlan.findUnique({
      where: { id: planId },
      include: {
        vehicleAssignments: {
          include: {
            vehicle: true,
            agentProfile: { include: { user: { select: { id: true, fullName: true } } } },
            stops: { orderBy: { sequenceNumber: 'asc' } },
          },
        },
      },
    });
    if (!plan) {
      throw new NotFoundException(`Delivery plan ${planId} not found.`);
    }
    return plan;
  }

  async assignVehicle(planId: string, dto: AssignVehicleDto, actorId: string) {
    const plan = await this.prisma.deliveryPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException(`Delivery plan ${planId} not found.`);
    }
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${dto.vehicleId} not found.`);
    }
    if (dto.agentProfileId) {
      const agent = await this.prisma.agentProfile.findUnique({ where: { id: dto.agentProfileId } });
      if (!agent) {
        throw new NotFoundException(`Agent profile ${dto.agentProfileId} not found.`);
      }
    }

    const planVehicle = await this.prisma.deliveryPlanVehicle.create({
      data: {
        deliveryPlanId: planId,
        vehicleId: dto.vehicleId,
        agentProfileId: dto.agentProfileId,
        cylindersLoaded: dto.cylindersLoaded,
        cylindersRemaining: dto.cylindersLoaded,
      },
    });

    this.events.emit('delivery.vehicle_assigned', {
      planVehicleId: planVehicle.id,
      planId,
      actorId,
      afterState: planVehicle,
      occurredAt: new Date(),
    });

    return planVehicle;
  }

  /**
   * Manual, human-reported stock update — no automatic decrement exists
   * anywhere in this module (see AdjustVehicleLoadDto for why).
   */
  async adjustVehicleLoad(planVehicleId: string, dto: AdjustVehicleLoadDto, actorId: string) {
    const existing = await this.prisma.deliveryPlanVehicle.findUnique({ where: { id: planVehicleId } });
    if (!existing) {
      throw new NotFoundException(`Plan-vehicle assignment ${planVehicleId} not found.`);
    }
    const updated = await this.prisma.deliveryPlanVehicle.update({
      where: { id: planVehicleId },
      data: { cylindersRemaining: dto.cylindersRemaining },
    });
    this.events.emit('delivery.vehicle_load_adjusted', {
      planVehicleId,
      actorId,
      beforeState: existing,
      afterState: updated,
      occurredAt: new Date(),
    });
    return updated;
  }

  // ---------------------------------------------------------------------
  // Stops: assignment, sequencing, agent view
  // ---------------------------------------------------------------------

  /**
   * Creates the request's Delivery record (first assignment only — a
   * request can only be assigned once, since assignment requires
   * DELIVERY_QUEUE and the resulting transition to DELIVERY_PLANNED
   * removes it from that state) and its first DeliveryStop (attempt 1),
   * atomically with the request's DELIVERY_QUEUE -> DELIVERY_PLANNED
   * transition (via the shared `tx`, see RequestIntakeService.transition).
   * A partial failure here cannot leave a stop with no corresponding
   * request-status change, or vice versa.
   */
  async assignStop(deliveryPlanVehicleId: string, dto: AssignStopDto, actorId: string) {
    const planVehicle = await this.prisma.deliveryPlanVehicle.findUnique({ where: { id: deliveryPlanVehicleId } });
    if (!planVehicle) {
      throw new NotFoundException(`Plan-vehicle assignment ${deliveryPlanVehicleId} not found.`);
    }

    const request = await this.prisma.request.findUnique({ where: { id: dto.requestId } });
    if (!request) {
      throw new NotFoundException(`Request ${dto.requestId} not found.`);
    }
    if (request.status !== 'DELIVERY_QUEUE') {
      throw new BadRequestException(
        `Request ${dto.requestId} must be in DELIVERY_QUEUE to be assigned a stop (currently ${request.status}).`,
      );
    }

    const stop = await this.prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.upsert({
        where: { requestId: request.id },
        update: {},
        create: { requestId: request.id, status: 'PENDING' },
      });

      const nextSequence = await this.nextSequenceNumber(tx, deliveryPlanVehicleId);

      const created = await tx.deliveryStop.create({
        data: {
          deliveryId: delivery.id,
          deliveryPlanVehicleId,
          sequenceNumber: nextSequence,
          attemptNumber: 1,
          status: 'SCHEDULED',
        },
      });

      await this.requestIntake.transition(request.id, 'DELIVERY_PLANNED', actorId, request.version, tx);

      return created;
    });

    this.events.emit('delivery.stop_assigned', {
      stopId: stop.id,
      requestId: request.id,
      deliveryPlanVehicleId,
      actorId,
      afterState: stop,
      occurredAt: new Date(),
    });

    return stop;
  }

  /**
   * Manual reordering only (docs/ARCHITECTURE_REVIEW.md §D / B-2) — no
   * route-optimization algorithm. Requires the full stop list for the
   * plan-vehicle to avoid an ambiguous partial resequence.
   */
  async sequenceStops(deliveryPlanVehicleId: string, dto: SequenceStopsDto, actorId: string) {
    const stops = await this.prisma.deliveryStop.findMany({ where: { deliveryPlanVehicleId } });
    if (stops.length !== dto.orderedStopIds.length) {
      throw new BadRequestException(
        `Expected all ${stops.length} stop(s) for plan-vehicle ${deliveryPlanVehicleId}, received ${dto.orderedStopIds.length}.`,
      );
    }
    const validIds = new Set(stops.map((s) => s.id));
    for (const id of dto.orderedStopIds) {
      if (!validIds.has(id)) {
        throw new BadRequestException(`Stop ${id} does not belong to plan-vehicle ${deliveryPlanVehicleId}.`);
      }
    }

    await this.prisma.$transaction(
      dto.orderedStopIds.map((id, index) =>
        this.prisma.deliveryStop.update({ where: { id }, data: { sequenceNumber: index + 1 } }),
      ),
    );

    this.events.emit('delivery.stops_sequenced', {
      deliveryPlanVehicleId,
      actorId,
      orderedStopIds: dto.orderedStopIds,
      occurredAt: new Date(),
    });

    return this.prisma.deliveryStop.findMany({ where: { deliveryPlanVehicleId }, orderBy: { sequenceNumber: 'asc' } });
  }

  /** Resolves the calling user's own AgentProfile — used by GET /agent/delivery-stops. */
  async getAgentDeliveriesForUser(userId: string) {
    const profile = await this.prisma.agentProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException(`No agent profile exists for user ${userId}.`);
    }
    return this.getAgentDeliveries(profile.id);
  }

  /** REQ-025: "today's route" for a delivery agent — excludes concluded stops. */
  async getAgentDeliveries(agentProfileId: string) {
    return this.prisma.deliveryStop.findMany({
      where: {
        deliveryPlanVehicle: { agentProfileId },
        status: { notIn: TERMINAL_STOP_STATUSES },
      },
      include: {
        delivery: {
          include: {
            request: { include: { beneficiary: true, priorityGroups: { include: { priorityGroup: true } } } },
          },
        },
        deliveryPlanVehicle: { include: { vehicle: true, deliveryPlan: true } },
      },
      orderBy: { sequenceNumber: 'asc' },
    });
  }

  // ---------------------------------------------------------------------
  // Stop execution: begin / OTP outcomes / reschedule.
  //
  // beginStopAttempt() and recordOtpOutcome() are NOT exposed via this
  // module's own controller — no HTTP route in this module writes an
  // execution-phase stop status. They exist as the seam the (not yet
  // built) Otp module calls into: ARCH-DECISION-19 requires that
  // recordOtpOutcome() be the ONLY path to CONFIRMED anywhere in the
  // system, which is only meaningful if callers reach it through here,
  // never by writing delivery_stops.status directly.
  // ---------------------------------------------------------------------

  async beginStopAttempt(stopId: string, actorId: string) {
    const stop = await this.prisma.deliveryStop.findUnique({ where: { id: stopId }, include: { delivery: true } });
    if (!stop) {
      throw new NotFoundException(`Delivery stop ${stopId} not found.`);
    }

    const updatedStop = await this.transitionStop(stopId, 'IN_PROGRESS');

    const request = await this.prisma.request.findUnique({ where: { id: stop.delivery.requestId } });
    if (request?.status === 'DELIVERY_PLANNED') {
      await this.requestIntake.transition(request.id, 'DELIVERY_IN_PROGRESS', actorId, request.version);
    }

    this.events.emit('delivery.stop_started', {
      stopId,
      actorId,
      afterState: updatedStop,
      occurredAt: new Date(),
    });

    return updatedStop;
  }

  /**
   * ARCH-DECISION-19: the sole path to CONFIRMED. Non-CONFIRMED outcomes
   * (OTP_SENT/OTP_SEND_FAILED/OTP_VERIFY_FAILED) only touch the stop;
   * CONFIRMED additionally marks the parent Delivery DELIVERED and moves
   * the request to DELIVERED — atomically, in one transaction.
   */
  async recordOtpOutcome(
    stopId: string,
    toStatus: Extract<DeliveryStopStatus, 'OTP_SENT' | 'OTP_SEND_FAILED' | 'OTP_VERIFY_FAILED' | 'CONFIRMED' | 'FAILED'>,
    actorId: string,
  ) {
    if (toStatus === 'CONFIRMED') {
      return this.confirmStop(stopId, actorId);
    }
    const updated = await this.transitionStop(stopId, toStatus);
    this.events.emit('delivery.stop_status_changed', {
      stopId,
      actorId,
      toStatus,
      afterState: updated,
      occurredAt: new Date(),
    });
    return updated;
  }

  private async confirmStop(stopId: string, actorId: string) {
    const stop = await this.prisma.deliveryStop.findUnique({ where: { id: stopId }, include: { delivery: true } });
    if (!stop) {
      throw new NotFoundException(`Delivery stop ${stopId} not found.`);
    }
    const request = await this.prisma.request.findUniqueOrThrow({ where: { id: stop.delivery.requestId } });

    const updatedStop = await this.prisma.$transaction(async (tx) => {
      const confirmed = await this.transitionStop(stopId, 'CONFIRMED', tx);
      await tx.delivery.update({
        where: { id: stop.deliveryId },
        data: { status: 'DELIVERED', confirmedAt: new Date() },
      });
      await this.requestIntake.transition(request.id, 'DELIVERED', actorId, request.version, tx);
      return confirmed;
    });

    this.events.emit('delivery.confirmed', {
      stopId,
      requestId: request.id,
      actorId,
      afterState: updatedStop,
      occurredAt: new Date(),
    });

    return updatedStop;
  }

  /**
   * ARCH-DECISION-07: creates a NEW attempt (new row) rather than
   * reopening the failed one — the dispatcher explicitly chooses the
   * plan/vehicle for the retry. Same-day vs. next-day reschedule policy
   * is OPEN-BUSINESS-DECISION-41; this only provides the mechanism.
   */
  async rescheduleStop(failedStopId: string, dto: RescheduleStopDto, actorId: string) {
    const failedStop = await this.prisma.deliveryStop.findUnique({ where: { id: failedStopId } });
    if (!failedStop) {
      throw new NotFoundException(`Delivery stop ${failedStopId} not found.`);
    }
    if (failedStop.status !== 'FAILED' && failedStop.status !== 'CANCELLED') {
      throw new BadRequestException(
        `Stop ${failedStopId} is ${failedStop.status}; only FAILED or CANCELLED stops can be rescheduled.`,
      );
    }
    const planVehicle = await this.prisma.deliveryPlanVehicle.findUnique({
      where: { id: dto.deliveryPlanVehicleId },
    });
    if (!planVehicle) {
      throw new NotFoundException(`Plan-vehicle assignment ${dto.deliveryPlanVehicleId} not found.`);
    }

    const newStop = await this.prisma.$transaction(async (tx) => {
      const nextSequence = await this.nextSequenceNumber(tx, dto.deliveryPlanVehicleId);
      return tx.deliveryStop.create({
        data: {
          deliveryId: failedStop.deliveryId,
          deliveryPlanVehicleId: dto.deliveryPlanVehicleId,
          sequenceNumber: nextSequence,
          attemptNumber: failedStop.attemptNumber + 1,
          status: 'SCHEDULED',
        },
      });
    });

    this.events.emit('delivery.stop_rescheduled', {
      previousStopId: failedStopId,
      newStopId: newStop.id,
      actorId,
      afterState: newStop,
      occurredAt: new Date(),
    });

    return newStop;
  }

  // ---------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------

  private async nextSequenceNumber(tx: Prisma.TransactionClient, deliveryPlanVehicleId: string): Promise<number> {
    const last = await tx.deliveryStop.aggregate({
      where: { deliveryPlanVehicleId },
      _max: { sequenceNumber: true },
    });
    return (last._max.sequenceNumber ?? 0) + 1;
  }

  /**
   * Mirrors RequestIntakeService.transition()'s atomic-conditional-update
   * pattern for delivery_stops.status, using the row's own `version`
   * column for optimistic concurrency (ARCH-DECISION-14).
   */
  private async transitionStop(
    stopId: string,
    toStatus: DeliveryStopStatus,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    const validFromStatuses = getValidStopPredecessors(toStatus);
    if (validFromStatuses.length === 0) {
      throw new BadRequestException(`No transition into delivery-stop status ${toStatus} is defined.`);
    }

    const before = await db.deliveryStop.findUnique({ where: { id: stopId } });
    if (!before) {
      throw new NotFoundException(`Delivery stop ${stopId} not found.`);
    }

    const result = await db.deliveryStop.updateMany({
      where: { id: stopId, version: before.version, status: { in: validFromStatuses } },
      data: {
        status: toStatus,
        version: { increment: 1 },
        completedAt: TERMINAL_STOP_STATUSES.includes(toStatus) ? new Date() : undefined,
      },
    });

    if (result.count === 0) {
      const current = await db.deliveryStop.findUnique({ where: { id: stopId } });
      if (!current) {
        throw new NotFoundException(`Delivery stop ${stopId} not found.`);
      }
      if (current.version !== before.version) {
        throw new ConflictException(
          `Delivery stop ${stopId} was modified concurrently (expected version ${before.version}, found ${current.version}). Reload and retry.`,
        );
      }
      throw new BadRequestException(
        `Illegal transition: delivery stop ${stopId} is ${current.status}, cannot move to ${toStatus}.`,
      );
    }

    return db.deliveryStop.findUniqueOrThrow({ where: { id: stopId } });
  }
}
