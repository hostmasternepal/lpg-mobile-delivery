// Types mirror what the backend services actually return (see
// backend/src/modules/*/*.service.ts) — kept hand-written rather than
// generated, so a field only appears here once it's genuinely used by a
// page.

export const SOURCE_CHANNELS = [
  'HELLO_SARKAR',
  'SOCIAL_MEDIA',
  'NEWS_MEDIA',
  'CALL_CENTRE',
  'LOCAL_GOV',
  'COMMUNITY_REP',
  'OTHER',
] as const;
export type SourceChannel = (typeof SOURCE_CHANNELS)[number];

export const PRIORITY_GROUP_CODES = [
  'EXTREME_POVERTY',
  'STUDENT',
  'MARGINALIZED_AT_RISK',
  'SENIOR_CITIZEN',
  'PERSON_WITH_DISABILITY',
  'WOMEN_HEADED_POOR_FAMILY',
  'ESSENTIAL_SERVICE',
  'OTHER_HUMANITARIAN_NEED',
] as const;
export type PriorityGroupCode = (typeof PRIORITY_GROUP_CODES)[number];

export type RequestStatus =
  | 'RECORDED'
  | 'VERIFIED'
  | 'SHORTLISTED'
  | 'DELIVERY_QUEUE'
  | 'DELIVERY_PLANNED'
  | 'DELIVERY_IN_PROGRESS'
  | 'DELIVERED'
  | 'PENDING'
  | 'REJECTED';

export type DeliveryStopStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'OTP_SENT'
  | 'OTP_SEND_FAILED'
  | 'OTP_VERIFY_FAILED'
  | 'CONFIRMED'
  | 'FAILED'
  | 'CANCELLED';

export interface Location {
  district?: string;
  municipality?: string;
  ward?: string;
  lat?: number;
  lng?: number;
}

export interface Beneficiary {
  id: string;
  name: string | null;
  mobileNumber: string | null;
  addressText: string | null;
  location: Location | null;
  createdAt: string;
}

export interface PriorityGroup {
  id: string;
  code: PriorityGroupCode;
  labelEn: string;
  labelNe: string | null;
}

export interface RequestPriorityGroup {
  requestId: string;
  priorityGroupId: string;
  assessedUnderPolicyVersionId: string | null;
  priorityGroup: PriorityGroup;
}

export interface LpgRequest {
  id: string;
  beneficiaryId: string | null;
  lpgNeedDescription: string | null;
  familyGroupStatus: string | null;
  sourceChannel: SourceChannel;
  status: RequestStatus;
  version: number;
  requestedAt: string | null;
  createdAt: string;
  createdById: string | null;
  beneficiary: Beneficiary | null;
  priorityGroups: RequestPriorityGroup[];
}

export interface PaginatedRequests {
  items: LpgRequest[];
  total: number;
  limit: number;
  offset: number;
}

export interface VerificationOutcomeRef {
  id: string;
  code: 'CONFIRMED' | 'FAILED';
}

export interface Verification {
  id: string;
  requestId: string;
  verifiedById: string | null;
  method: 'PHONE' | 'OTHER';
  outcomeId: string;
  notes: string | null;
  verifiedAt: string;
  outcome: VerificationOutcomeRef;
  verifiedBy: { id: string; fullName: string; phoneOrUsername: string } | null;
}

export interface PriorityOverride {
  id: string;
  requestId: string;
  previousGroups: unknown;
  newGroups: unknown;
  actorId: string;
  reason: string;
  createdAt: string;
  actor: { id: string; fullName: string; phoneOrUsername: string };
}

export interface PriorityPolicyVersion {
  id: string;
  versionLabel: string;
  scoringFormula: Record<string, unknown> | null;
  activatedAt: string | null;
  activatedById: string | null;
  rules?: unknown[];
}

export interface Vehicle {
  id: string;
  identifier: string;
  capacityCylinders: number | null;
  status: string;
}

export interface AgentProfile {
  id: string;
  userId: string;
  licenseRef: string | null;
  status: string;
  user?: { id: string; fullName: string; phoneOrUsername: string };
}

export interface DeliveryPlan {
  id: string;
  planDate: string;
  status: string;
  createdAt: string;
}

export interface DeliveryStop {
  id: string;
  deliveryId: string;
  deliveryPlanVehicleId: string | null;
  sequenceNumber: number | null;
  attemptNumber: number;
  status: DeliveryStopStatus;
  version: number;
  plannedAt: string | null;
  completedAt: string | null;
  delivery?: { id: string; requestId: string; status: string; request: LpgRequest };
  deliveryPlanVehicle?: DeliveryPlanVehicle;
}

export interface DeliveryPlanVehicle {
  id: string;
  deliveryPlanId: string;
  vehicleId: string;
  agentProfileId: string | null;
  cylindersLoaded: number;
  cylindersRemaining: number;
  vehicle?: Vehicle;
  agentProfile?: AgentProfile;
  deliveryPlan?: DeliveryPlan;
  stops?: DeliveryStop[];
}

export interface DeliveryPlanDetail extends DeliveryPlan {
  vehicleAssignments: DeliveryPlanVehicle[];
}

export interface OtpVerifyResult {
  success: boolean;
  reason?: 'expired' | 'exhausted' | 'mismatch';
  attemptsRemaining?: number;
  stop: DeliveryStop;
}

export interface DashboardSummary {
  totalRequests: number;
  verifiedRequests: number;
  priorityRequests: number;
  shortlistedRequests: number;
  deliveryPlanned: number;
  deliveryInProgress: number;
  delivered: number;
  pendingOrRejected: number;
  sourceBreakdown: { sourceChannel: string; count: number }[];
}

export interface DistrictDemand {
  district: string;
  count: number;
}

export interface DailyDistribution {
  date: string;
  count: number;
}

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeState: unknown;
  afterState: unknown;
  correlationId: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AppUser {
  id: string;
  fullName: string;
  phoneOrUsername: string;
  isActive: boolean;
  roles: string[];
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
}
