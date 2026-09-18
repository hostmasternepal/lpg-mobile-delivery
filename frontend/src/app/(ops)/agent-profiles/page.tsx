'use client';

import { FormEvent, useEffect, useState } from 'react';
import { RequireAuth } from '@/lib/require-auth';
import { useAuth } from '@/lib/auth-context';
import { createAgentProfile, listAgentProfiles } from '@/lib/api/delivery';
import { listUsers } from '@/lib/api/users';
import { AgentProfile, AppUser } from '@/lib/api/types';
import { ApiError } from '@/lib/api-client';

export default function AgentProfilesPage() {
  return (
    <RequireAuth requiredPermission="delivery-plan:read">
      <AgentProfilesContent />
    </RequireAuth>
  );
}

function AgentProfilesContent() {
  const { accessToken, user } = useAuth();
  const [profiles, setProfiles] = useState<AgentProfile[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const canManageUsers = user?.permissions.includes('user:manage');

  function refetch() {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([listAgentProfiles(accessToken), canManageUsers ? listUsers(accessToken) : Promise.resolve([])])
      .then(([p, u]) => {
        setProfiles(p);
        setUsers(u);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load agent profiles.'))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(refetch, [accessToken]);

  const agentUsers = users.filter((u) => u.roles.includes('DELIVERY_AGENT'));
  const profiledUserIds = new Set(profiles.map((p) => p.userId));
  const availableUsers = agentUsers.filter((u) => !profiledUserIds.has(u.id));

  return (
    <main>
      <h1>Delivery agents</h1>
      {error && <p className="error">{error}</p>}
      {loading && <p className="hint">Loading…</p>}

      <div className="card-grid">
        <div className="card">
          <h2>Agent profiles</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Login</th>
                <th>License ref.</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id}>
                  <td>{p.user?.fullName ?? <span className="hint">—</span>}</td>
                  <td>{p.user?.phoneOrUsername ?? <span className="hint">—</span>}</td>
                  <td>{p.licenseRef ?? <span className="hint">—</span>}</td>
                  <td>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {user?.permissions.includes('delivery:assign') && (
          <div className="card">
            <h2>Add agent profile</h2>
            {canManageUsers && availableUsers.length === 0 && (
              <p className="hint">
                No unassigned users with the DELIVERY_AGENT role. Create one on the{' '}
                <a href="/users">Users</a> page first.
              </p>
            )}
            <CreateAgentProfileForm users={availableUsers} onCreated={refetch} />
          </div>
        )}
      </div>
    </main>
  );
}

function CreateAgentProfileForm({ users, onCreated }: { users: AppUser[]; onCreated: () => void }) {
  const { accessToken } = useAuth();
  const [userId, setUserId] = useState('');
  const [licenseRef, setLicenseRef] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken || !userId) return;
    setError(null);
    setSubmitting(true);
    try {
      await createAgentProfile(accessToken, { userId, licenseRef: licenseRef || undefined });
      setUserId('');
      setLicenseRef('');
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add agent profile.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="userId">User</label>
        <select id="userId" value={userId} onChange={(e) => setUserId(e.target.value)} required>
          <option value="">Select a user…</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName} ({u.phoneOrUsername})
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="licenseRef">License ref. (optional)</label>
        <input id="licenseRef" value={licenseRef} onChange={(e) => setLicenseRef(e.target.value)} />
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={submitting || !userId}>
        {submitting ? 'Adding…' : 'Add agent profile'}
      </button>
    </form>
  );
}
