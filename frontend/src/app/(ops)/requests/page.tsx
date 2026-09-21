'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { StatusBadge } from '@/components/status-badge';
import { useAuth } from '@/lib/auth-context';
import { RequireAuth } from '@/lib/require-auth';
import { listRequests } from '@/lib/api/requests';
import { PaginatedRequests, RequestStatus, SOURCE_CHANNELS, SourceChannel } from '@/lib/api/types';
import { ApiError } from '@/lib/api-client';

const STATUSES: RequestStatus[] = [
  'RECORDED',
  'VERIFIED',
  'SHORTLISTED',
  'DELIVERY_QUEUE',
  'DELIVERY_PLANNED',
  'DELIVERY_IN_PROGRESS',
  'DELIVERED',
  'PENDING',
  'REJECTED',
];

export default function RequestsPage() {
  return (
    <RequireAuth requiredPermission="request:read">
      <RequestsContent />
    </RequireAuth>
  );
}

function RequestsContent() {
  const { accessToken, user } = useAuth();
  const [data, setData] = useState<PaginatedRequests | null>(null);
  const [status, setStatus] = useState('');
  const [sourceChannel, setSourceChannel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    listRequests(accessToken, { status: status || undefined, sourceChannel: sourceChannel || undefined, limit: 50 })
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load requests.'))
      .finally(() => setLoading(false));
  }, [accessToken, status, sourceChannel]);

  return (
    <main>
      <div className="toolbar">
        <h1 style={{ marginRight: 'auto' }}>Requests</h1>
        {user?.permissions.includes('request:create') && <Link href="/requests/new">+ New request</Link>}
      </div>

      <div className="toolbar">
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="status">Status</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="source">Source</label>
          <select id="source" value={sourceChannel} onChange={(e) => setSourceChannel(e.target.value)}>
            <option value="">All</option>
            {SOURCE_CHANNELS.map((s: SourceChannel) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="hint">Loading…</p>}

      {data && (
        <>
          <p className="hint">{data.total} request(s)</p>
          <table>
            <thead>
              <tr>
                <th>Beneficiary</th>
                <th>Mobile</th>
                <th>Source</th>
                <th>Status</th>
                <th>Priority groups</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((r) => (
                <tr key={r.id} className="clickable" onClick={() => (window.location.href = `/requests/${r.id}`)}>
                  <td>{r.beneficiary?.name ?? <span className="hint">—</span>}</td>
                  <td>{r.beneficiary?.mobileNumber ?? <span className="hint">—</span>}</td>
                  <td>{r.sourceChannel}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>{r.priorityGroups.length}</td>
                  <td>{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
