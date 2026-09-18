'use client';

import { useAuth } from '@/lib/auth-context';
import { RequireAuth } from '@/lib/require-auth';

/**
 * Placeholder portal for DeliveryAgent (REQ-025-028): assigned stops for
 * today's route, OTP start/verify/resend. Depends on
 * DeliveryPlanningService.getAgentDeliveries() and OtpService, both
 * scaffolded but not yet implemented server-side. Field-connectivity
 * resilience (offline queue + sync) is a known future requirement here —
 * see docs/ARCHITECTURE_REVIEW.md I-5/ARCH-DECISION-21 — not built yet.
 */
export default function DeliveriesPage() {
  return (
    <RequireAuth requiredPermission="delivery:read-own">
      <DeliveriesContent />
    </RequireAuth>
  );
}

function DeliveriesContent() {
  const { user, logout } = useAuth();
  return (
    <main>
      <h1>My deliveries</h1>
      <p>Signed in as {user?.phoneOrUsername} ({user?.roles.join(', ')})</p>
      <p>Assigned delivery stops and OTP confirmation UI are not yet implemented.</p>
      <button onClick={() => logout()}>Sign out</button>
    </main>
  );
}
