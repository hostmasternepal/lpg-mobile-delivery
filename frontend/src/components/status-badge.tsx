const GOOD = new Set(['DELIVERED', 'CONFIRMED', 'VERIFIED', 'PROCESSED', 'ACTIVE', 'DISPATCHED']);
const WARN = new Set([
  'RECORDED',
  'SHORTLISTED',
  'DELIVERY_QUEUE',
  'DELIVERY_PLANNED',
  'DELIVERY_IN_PROGRESS',
  'SCHEDULED',
  'IN_PROGRESS',
  'OTP_SENT',
  'DRAFT',
  'QUEUED',
  'RECEIVED',
]);
const BAD = new Set([
  'PENDING',
  'REJECTED',
  'FAILED',
  'CANCELLED',
  'OTP_SEND_FAILED',
  'OTP_VERIFY_FAILED',
  'DUPLICATE',
]);

export function StatusBadge({ status }: { status: string }) {
  const variant = GOOD.has(status) ? 'badge-good' : BAD.has(status) ? 'badge-bad' : WARN.has(status) ? 'badge-warn' : 'badge-neutral';
  return <span className={`badge ${variant}`}>{status.replace(/_/g, ' ')}</span>;
}
