'use client';

import { useAuth } from '@/lib/auth-context';
import { RequireAuth } from '@/lib/require-auth';

/**
 * Placeholder portal for IntakeOperator / VerificationOfficer /
 * DispatchCoordinator (REQ-016-025). Real request intake/verification/
 * shortlisting UI depends on RequestIntakeService/VerificationService,
 * which are scaffolded but not yet implemented server-side.
 */
export default function RequestsPage() {
  return (
    <RequireAuth requiredPermission="request:read">
      <RequestsContent />
    </RequireAuth>
  );
}

function RequestsContent() {
  const { user, logout } = useAuth();
  return (
    <main>
      <h1>Requests</h1>
      <p>Signed in as {user?.phoneOrUsername} ({user?.roles.join(', ')})</p>
      <p>Request intake/verification/shortlisting UI is not yet implemented.</p>
      <button onClick={() => logout()}>Sign out</button>
    </main>
  );
}
