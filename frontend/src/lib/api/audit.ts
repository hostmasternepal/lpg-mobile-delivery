import { apiFetch } from '../api-client';
import { AuditLogEntry } from './types';

export function listAuditLogs(
  accessToken: string,
  params: { entityType?: string; entityId?: string; actorId?: string } = {},
) {
  const query = new URLSearchParams();
  if (params.entityType) query.set('entityType', params.entityType);
  if (params.entityId) query.set('entityId', params.entityId);
  if (params.actorId) query.set('actorId', params.actorId);
  const qs = query.toString();
  return apiFetch<AuditLogEntry[]>(`/audit-logs${qs ? `?${qs}` : ''}`, { accessToken });
}
