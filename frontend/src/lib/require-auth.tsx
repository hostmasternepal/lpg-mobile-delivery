'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from './auth-context';

/**
 * Client-side route gating. This is a UX convenience only, not a security
 * boundary — the backend's PermissionsGuard (deny-by-default) is what
 * actually enforces access on every API call, per docs/ARCHITECTURE.md
 * §7. A page wrapped here can still only fetch what the user's token
 * grants.
 */
export function RequireAuth({
  requiredPermission,
  children,
}: {
  requiredPermission?: string;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (requiredPermission && !user.permissions.includes(requiredPermission)) {
      router.replace('/');
    }
  }, [user, loading, requiredPermission, router]);

  if (loading || !user) {
    return <main>Loading…</main>;
  }

  return <>{children}</>;
}
