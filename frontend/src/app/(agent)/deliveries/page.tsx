'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { RequireAuth } from '@/lib/require-auth';
import { useAuth } from '@/lib/auth-context';
import { StatusBadge } from '@/components/status-badge';
import { getMyDeliveries } from '@/lib/api/delivery';
import { resendOtp, startDelivery, verifyOtp } from '@/lib/api/otp';
import { DeliveryStop } from '@/lib/api/types';
import { ApiError } from '@/lib/api-client';

export default function DeliveriesPage() {
  return (
    <RequireAuth requiredPermission="delivery:read-own">
      <DeliveriesContent />
    </RequireAuth>
  );
}

function DeliveriesContent() {
  const { accessToken, user } = useAuth();
  const [stops, setStops] = useState<DeliveryStop[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    if (!accessToken) return;
    setLoading(true);
    getMyDeliveries(accessToken)
      .then(setStops)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load your deliveries.'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  useEffect(refetch, [refetch]);

  return (
    <main>
      <h1>My deliveries</h1>
      <p className="hint">
        Signed in as {user?.phoneOrUsername}. Confirmed, failed, and cancelled stops drop off this list once
        concluded (REQ-025).
      </p>
      {error && <p className="error">{error}</p>}
      {loading && <p className="hint">Loading…</p>}

      {!loading && stops.length === 0 && <p className="hint">No deliveries assigned to you right now.</p>}

      <div className="card-grid">
        {stops.map((stop) => (
          <StopCard key={stop.id} stop={stop} onChanged={refetch} />
        ))}
      </div>
    </main>
  );
}

function StopCard({ stop, onChanged }: { stop: DeliveryStop; onChanged: () => void }) {
  const { accessToken, user } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const request = stop.delivery?.request;
  const canStart = user?.permissions.includes('delivery:start') ?? false;
  const canVerify = user?.permissions.includes('otp:verify') ?? false;
  const canResend = user?.permissions.includes('otp:resend') ?? false;

  async function withBusy(fn: () => Promise<void>) {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  }

  async function onStart() {
    if (!accessToken) return;
    await withBusy(async () => {
      await startDelivery(accessToken, stop.id);
      onChanged();
    });
  }

  async function onResend() {
    if (!accessToken) return;
    await withBusy(async () => {
      await resendOtp(accessToken, stop.id);
      onChanged();
    });
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault();
    if (!accessToken || !code.trim()) return;
    await withBusy(async () => {
      const result = await verifyOtp(accessToken, stop.id, code.trim());
      if (result.success) {
        setCode('');
        onChanged();
      } else {
        setInfo(
          result.reason === 'exhausted'
            ? 'Incorrect code — no attempts remaining. Request a new code.'
            : result.reason === 'expired'
              ? 'This code has expired. Request a new one.'
              : `Incorrect code. ${result.attemptsRemaining ?? 0} attempt(s) remaining.`,
        );
        onChanged();
      }
    });
  }

  return (
    <div className="card">
      <h2>{request?.beneficiary?.name ?? 'Beneficiary'}</h2>
      <p>
        <StatusBadge status={stop.status} />
      </p>
      <p className="hint">
        {request?.beneficiary?.mobileNumber ?? '—'} · {request?.beneficiary?.location?.district ?? '—'}
      </p>
      <p>{request?.beneficiary?.addressText ?? <span className="hint">No address on file</span>}</p>
      <p className="hint">Stop {stop.sequenceNumber} · attempt {stop.attemptNumber}</p>

      {error && <p className="error">{error}</p>}
      {info && <p className="hint">{info}</p>}

      {stop.status === 'SCHEDULED' && canStart && (
        <button type="button" disabled={busy} onClick={onStart}>
          Start delivery (sends OTP)
        </button>
      )}

      {stop.status === 'OTP_SENT' && canVerify && (
        <form onSubmit={onVerify} className="toolbar">
          <input
            placeholder="OTP code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            maxLength={6}
          />
          <button type="submit" disabled={busy || !code.trim()}>
            Confirm
          </button>
        </form>
      )}

      {['OTP_SENT', 'OTP_SEND_FAILED', 'OTP_VERIFY_FAILED'].includes(stop.status) && canResend && (
        <button type="button" disabled={busy} onClick={onResend}>
          {stop.status === 'OTP_SEND_FAILED' ? 'Retry sending OTP' : 'Resend OTP'}
        </button>
      )}
    </div>
  );
}
