import { apiFetch } from '../api-client';
import { AgentProfile, DeliveryPlan, DeliveryPlanDetail, DeliveryPlanVehicle, DeliveryStop, LpgRequest, Vehicle } from './types';

// --- Queue (REQ-020/021) ---

export function shortlistRequest(accessToken: string, requestId: string, expectedVersion: number) {
  return apiFetch<LpgRequest>(`/requests/${requestId}/shortlist`, {
    method: 'POST',
    body: JSON.stringify({ expectedVersion }),
    accessToken,
  });
}

export function queueRequest(accessToken: string, requestId: string, expectedVersion: number) {
  return apiFetch<LpgRequest>(`/requests/${requestId}/queue`, {
    method: 'POST',
    body: JSON.stringify({ expectedVersion }),
    accessToken,
  });
}

export function getDeliveryQueue(accessToken: string) {
  return apiFetch<LpgRequest[]>('/delivery-queue', { accessToken });
}

// --- Fleet ---

export function listVehicles(accessToken: string) {
  return apiFetch<Vehicle[]>('/vehicles', { accessToken });
}

export function createVehicle(accessToken: string, input: { identifier: string; capacityCylinders?: number }) {
  return apiFetch<Vehicle>('/vehicles', { method: 'POST', body: JSON.stringify(input), accessToken });
}

export function listAgentProfiles(accessToken: string) {
  return apiFetch<AgentProfile[]>('/agent-profiles', { accessToken });
}

export function createAgentProfile(accessToken: string, input: { userId: string; licenseRef?: string }) {
  return apiFetch<AgentProfile>('/agent-profiles', { method: 'POST', body: JSON.stringify(input), accessToken });
}

// --- Plans ---

export function listPlans(accessToken: string) {
  return apiFetch<DeliveryPlan[]>('/delivery-plans', { accessToken });
}

export function generatePlan(accessToken: string, planDate: string) {
  return apiFetch<DeliveryPlan>('/delivery-plans', { method: 'POST', body: JSON.stringify({ planDate }), accessToken });
}

export function getPlan(accessToken: string, planId: string) {
  return apiFetch<DeliveryPlanDetail>(`/delivery-plans/${planId}`, { accessToken });
}

export function assignVehicleToPlan(
  accessToken: string,
  planId: string,
  input: { vehicleId: string; agentProfileId?: string; cylindersLoaded: number },
) {
  return apiFetch<DeliveryPlanVehicle>(`/delivery-plans/${planId}/vehicles`, {
    method: 'POST',
    body: JSON.stringify(input),
    accessToken,
  });
}

export function adjustVehicleLoad(accessToken: string, planVehicleId: string, cylindersRemaining: number) {
  return apiFetch<DeliveryPlanVehicle>(`/delivery-plan-vehicles/${planVehicleId}/load`, {
    method: 'PATCH',
    body: JSON.stringify({ cylindersRemaining }),
    accessToken,
  });
}

// --- Stops ---

export function assignStop(accessToken: string, planVehicleId: string, requestId: string) {
  return apiFetch<DeliveryStop>(`/delivery-plan-vehicles/${planVehicleId}/stops`, {
    method: 'POST',
    body: JSON.stringify({ requestId }),
    accessToken,
  });
}

export function sequenceStops(accessToken: string, planVehicleId: string, orderedStopIds: string[]) {
  return apiFetch<DeliveryStop[]>(`/delivery-plan-vehicles/${planVehicleId}/sequence`, {
    method: 'POST',
    body: JSON.stringify({ orderedStopIds }),
    accessToken,
  });
}

export function rescheduleStop(accessToken: string, stopId: string, deliveryPlanVehicleId: string) {
  return apiFetch<DeliveryStop>(`/delivery-stops/${stopId}/reschedule`, {
    method: 'POST',
    body: JSON.stringify({ deliveryPlanVehicleId }),
    accessToken,
  });
}

export function giveUpOnStop(accessToken: string, stopId: string, reason: string) {
  return apiFetch<DeliveryStop>(`/delivery-stops/${stopId}/give-up`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
    accessToken,
  });
}

export function getMyDeliveries(accessToken: string) {
  return apiFetch<DeliveryStop[]>('/agent/delivery-stops', { accessToken });
}
