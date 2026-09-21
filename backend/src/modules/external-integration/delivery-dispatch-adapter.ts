import { Logger } from '@nestjs/common';

/**
 * Outbound counterpart to IRequestSourceAdapter: decouples
 * DeliveryPlanning from any one distributor/delivery-company's API
 * shape (docs/ARCHITECTURE.md §11, REQ-053). The real integration
 * method is OPEN-BUSINESS-DECISION-29 — NoopDeliveryDispatchAdapter
 * (default, mirrors NotificationService's 'noop' SMS provider pattern)
 * logs instead of calling anything real, so this module has no
 * undeclared dependency on a partner system that doesn't exist yet.
 *
 * WHEN a dispatch should fire in the delivery lifecycle (on every stop
 * assignment? once per finalized plan?) is not specified anywhere in
 * the source documents, so DeliveryPlanningService does NOT call this
 * automatically — a DispatchCoordinator triggers it manually via
 * POST /integrations/distributor-dispatch with data they already have
 * from GET /delivery-plans/:id. Wiring an automatic trigger point later
 * is an explicit decision to make, not something this module infers.
 */
export interface DistributorDispatchPayload {
  planId: string;
  vehicleIdentifier: string;
  stopCount: number;
}

export interface IDeliveryDispatchAdapter {
  dispatch(payload: DistributorDispatchPayload): Promise<void>;
}

export class NoopDeliveryDispatchAdapter implements IDeliveryDispatchAdapter {
  private readonly logger = new Logger(NoopDeliveryDispatchAdapter.name);

  async dispatch(payload: DistributorDispatchPayload): Promise<void> {
    this.logger.log(
      `[noop distributor dispatch] plan=${payload.planId} vehicle=${payload.vehicleIdentifier} stops=${payload.stopCount} (OPEN-BUSINESS-DECISION-29)`,
    );
  }
}
