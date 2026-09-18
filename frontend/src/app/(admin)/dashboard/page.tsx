'use client';

import { useAuth } from '@/lib/auth-context';
import { RequireAuth } from '@/lib/require-auth';

/**
 * Placeholder for the MoICS/NOC Official dashboard (REQ-029, the 11
 * metrics). Real content depends on DashboardReportingService.getSummary(),
 * which is not yet implemented server-side (see backend/src/modules/
 * dashboard-reporting) — it deliberately reads only DashboardReporting's
 * own projection tables, never other modules' operational tables
 * (docs/ARCHITECTURE_REVIEW.md A-4/CRIT-6), so there is nothing to wire up
 * here until those projections exist.
 */
export default function DashboardPage() {
  return (
    <RequireAuth requiredPermission="dashboard:read">
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const { user, logout } = useAuth();
  return (
    <main>
      <h1>Dashboard</h1>
      <p>Signed in as {user?.phoneOrUsername} ({user?.roles.join(', ')})</p>
      <p>Real-time metrics (REQ-029) are not yet available — DashboardReportingService is scaffolded, not implemented.</p>
      <button onClick={() => logout()}>Sign out</button>
    </main>
  );
}
