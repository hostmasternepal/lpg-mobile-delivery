'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

/**
 * Landing route: sends an authenticated user to a role-appropriate
 * portal, or an unauthenticated one to /login. Role -> portal mapping is
 * intentionally minimal here — see docs/ARCHITECTURE.md §7 for the full
 * proposed RBAC matrix once each portal has real content.
 */
export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.roles.includes('DELIVERY_AGENT')) {
      router.replace('/deliveries');
    } else if (user.roles.some((r) => ['INTAKE_OPERATOR', 'VERIFICATION_OFFICER', 'DISPATCH_COORDINATOR'].includes(r))) {
      router.replace('/requests');
    } else {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  return <main>Loading…</main>;
}
