'use client';

import { Fragment, useEffect, useState } from 'react';
import { RequireAuth } from '@/lib/require-auth';
import { useAuth } from '@/lib/auth-context';
import { listAuditLogs } from '@/lib/api/audit';
import { AuditLogEntry } from '@/lib/api/types';
import { ApiError } from '@/lib/api-client';

export default function AuditLogsPage() {
  return (
    <RequireAuth requiredPermission="audit-log:read">
      <AuditLogsContent />
    </RequireAuth>
  );
}

function AuditLogsContent() {
  const { accessToken } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [actorId, setActorId] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    listAuditLogs(accessToken, {
      entityType: entityType || undefined,
      entityId: entityId || undefined,
      actorId: actorId || undefined,
    })
      .then(setLogs)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load audit logs.'))
      .finally(() => setLoading(false));
  }, [accessToken, entityType, entityId, actorId]);

  return (
    <main>
      <h1>Audit log</h1>
      <p className="hint">Every mutating action in the system, event-sourced and immutable (docs/ARCHITECTURE.md §10).</p>

      <div className="toolbar">
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="entityType">Entity type</label>
          <input
            id="entityType"
            placeholder="e.g. Request, DeliveryStop"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="entityId">Entity ID</label>
          <input id="entityId" value={entityId} onChange={(e) => setEntityId(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="actorId">Actor (user) ID</label>
          <input id="actorId" value={actorId} onChange={(e) => setActorId(e.target.value)} />
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="hint">Loading…</p>}
      {!loading && <p className="hint">{logs.length} entr{logs.length === 1 ? 'y' : 'ies'}</p>}

      <table>
        <thead>
          <tr>
            <th>When</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Actor</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <Fragment key={log.id}>
              <tr className="clickable" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.action}</td>
                <td>
                  {log.entityType} · {log.entityId.slice(0, 8)}…
                </td>
                <td>{log.actorId ? log.actorId.slice(0, 8) + '…' : <span className="hint">system</span>}</td>
                <td>{expandedId === log.id ? '▲' : '▼'}</td>
              </tr>
              {expandedId === log.id && (
                <tr>
                  <td colSpan={5}>
                    <div className="card-grid">
                      <div className="card">
                        <h3>Before</h3>
                        <pre>{JSON.stringify(log.beforeState, null, 2) || '—'}</pre>
                      </div>
                      <div className="card">
                        <h3>After</h3>
                        <pre>{JSON.stringify(log.afterState, null, 2) || '—'}</pre>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </main>
  );
}
