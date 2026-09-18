'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RequireAuth } from '@/lib/require-auth';
import { useAuth } from '@/lib/auth-context';
import { StatusBadge } from '@/components/status-badge';
import { getDeliveryQueue } from '@/lib/api/delivery';
import { LpgRequest } from '@/lib/api/types';
import { ApiError } from '@/lib/api-client';

export default function DeliveryQueuePage() {
  return (
    <RequireAuth requiredPermission="delivery-plan:read">
      <DeliveryQueueContent />
    </RequireAuth>
  );
}

function DeliveryQueueContent() {
  const { accessToken, user } = useAuth();
  const [requests, setRequests] = useState<LpgRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    getDeliveryQueue(accessToken)
      .then(setRequests)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load the delivery queue.'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <main>
      <div className="toolbar">
        <h1 style={{ marginRight: 'auto' }}>Delivery queue</h1>
        {user?.permissions.includes('delivery-plan:create') && <Link href="/delivery-plans">Delivery plans →</Link>}
      </div>
      <p className="hint">
        Requests waiting to be assigned to a vehicle. Assign a request to a stop from a plan&apos;s vehicle card on
        the delivery-plan detail page.
      </p>

      {error && <p className="error">{error}</p>}
      {loading && <p className="hint">Loading…</p>}

      {!loading && requests.length === 0 && <p className="hint">The queue is empty.</p>}

      {requests.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Beneficiary</th>
              <th>District</th>
              <th>Status</th>
              <th>Priority groups</th>
              <th>Queued since</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="clickable" onClick={() => (window.location.href = `/requests/${r.id}`)}>
                <td>{r.beneficiary?.name ?? <span className="hint">—</span>}</td>
                <td>{r.beneficiary?.location?.district ?? <span className="hint">—</span>}</td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td>{r.priorityGroups.length}</td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
