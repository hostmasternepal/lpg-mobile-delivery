'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface NavLink {
  href: string;
  label: string;
  permission?: string;
}

const LINKS: NavLink[] = [
  { href: '/requests', label: 'Requests', permission: 'request:read' },
  { href: '/delivery-queue', label: 'Delivery Queue', permission: 'delivery-plan:read' },
  { href: '/delivery-plans', label: 'Delivery Plans', permission: 'delivery-plan:read' },
  { href: '/vehicles', label: 'Fleet', permission: 'delivery-plan:read' },
  { href: '/agent-profiles', label: 'Agents', permission: 'delivery-plan:read' },
  { href: '/deliveries', label: 'My Deliveries', permission: 'delivery:read-own' },
  { href: '/dashboard', label: 'Dashboard', permission: 'dashboard:read' },
  { href: '/audit-logs', label: 'Audit Log', permission: 'audit-log:read' },
  { href: '/users', label: 'Users', permission: 'user:manage' },
];

/** Client-side gating only, for UX — the backend's PermissionsGuard is the real boundary. */
export function NavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  async function onLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <nav className="app-nav">
      <span className="brand">LPG Emergency Delivery</span>
      {LINKS.filter((link) => !link.permission || user.permissions.includes(link.permission)).map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
      <span className="spacer" />
      <span className="who">
        {user.phoneOrUsername} &middot; {user.roles.join(', ')}
      </span>
      <button className="secondary small" onClick={onLogout}>
        Sign out
      </button>
    </nav>
  );
}
