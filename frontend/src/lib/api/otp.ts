import { apiFetch } from '../api-client';
import { DeliveryStop, OtpVerifyResult } from './types';

export function startDelivery(accessToken: string, stopId: string) {
  return apiFetch<DeliveryStop>(`/delivery-stops/${stopId}/start`, { method: 'POST', accessToken });
}

export function verifyOtp(accessToken: string, stopId: string, code: string) {
  return apiFetch<OtpVerifyResult>(`/delivery-stops/${stopId}/otp/verify`, {
    method: 'POST',
    body: JSON.stringify({ code }),
    accessToken,
  });
}

export function resendOtp(accessToken: string, stopId: string) {
  return apiFetch<DeliveryStop>(`/delivery-stops/${stopId}/otp/resend`, { method: 'POST', accessToken });
}

export function manualOverride(accessToken: string, stopId: string, reason: string) {
  return apiFetch<DeliveryStop>(`/delivery-stops/${stopId}/otp/manual-override`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
    accessToken,
  });
}
