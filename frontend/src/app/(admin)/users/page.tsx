'use client';

import { FormEvent, useEffect, useState } from 'react';
import { RequireAuth } from '@/lib/require-auth';
import { useAuth } from '@/lib/auth-context';
import { createUser, listRoles, listUsers } from '@/lib/api/users';
import { AppUser, Role } from '@/lib/api/types';
import { ApiError } from '@/lib/api-client';

export default function UsersPage() {
  return (
    <RequireAuth requiredPermission="user:manage">
      <UsersContent />
    </RequireAuth>
  );
}

function UsersContent() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function refetch() {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([listUsers(accessToken), listRoles(accessToken)])
      .then(([u, r]) => {
        setUsers(u);
        setRoles(r);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load users.'))
      .finally(() => setLoading(false));
  }

  useEffect(refetch, [accessToken]);

  return (
    <main>
      <h1>Users</h1>
      {error && <p className="error">{error}</p>}
      {loading && <p className="hint">Loading…</p>}

      <div className="card-grid">
        <div className="card">
          <h2>All users</h2>
          <table>
            <thead>
              <tr>
                <th>Full name</th>
                <th>Login</th>
                <th>Roles</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td>{u.phoneOrUsername}</td>
                  <td>{u.roles.join(', ')}</td>
                  <td>{u.isActive ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>Create user</h2>
          <CreateUserForm roles={roles} onCreated={refetch} />
        </div>
      </div>
    </main>
  );
}

function CreateUserForm({ roles, onCreated }: { roles: Role[]; onCreated: () => void }) {
  const { accessToken } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phoneOrUsername, setPhoneOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleRole(name: string) {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    if (selectedRoles.size === 0) {
      setError('Select at least one role.');
      return;
    }
    setSubmitting(true);
    try {
      await createUser(accessToken, {
        fullName,
        phoneOrUsername,
        password,
        roleNames: Array.from(selectedRoles),
      });
      setFullName('');
      setPhoneOrUsername('');
      setPassword('');
      setSelectedRoles(new Set());
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="fullName">Full name</label>
        <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="login">Phone / username</label>
        <input id="login" value={phoneOrUsername} onChange={(e) => setPhoneOrUsername(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label>Roles</label>
        <div className="toolbar" style={{ flexWrap: 'wrap' }}>
          {roles.map((r) => (
            <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={selectedRoles.has(r.name)} onChange={() => toggleRole(r.name)} />
              {r.name}
            </label>
          ))}
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create user'}
      </button>
    </form>
  );
}
