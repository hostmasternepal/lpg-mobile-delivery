'use client';

import { useParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { RequireAuth } from '@/lib/require-auth';
import { useAuth } from '@/lib/auth-context';
import { StatusBadge } from '@/components/status-badge';
import {
  adjustVehicleLoad,
  assignStop,
  assignVehicleToPlan,
  getDeliveryQueue,
  getPlan,
  giveUpOnStop,
  listAgentProfiles,
  listVehicles,
  rescheduleStop,
  sequenceStops,
} from '@/lib/api/delivery';
import { manualOverride } from '@/lib/api/otp';
import { AgentProfile, DeliveryPlanDetail, DeliveryPlanVehicle, DeliveryStop, LpgRequest, Vehicle } from '@/lib/api/types';
import { ApiError } from '@/lib/api-client';

export default function DeliveryPlanDetailPage() {
  return (
    <RequireAuth requiredPermission="delivery-plan:read">
      <DeliveryPlanDetailContent />
    </RequireAuth>
  );
}

function DeliveryPlanDetailContent() {
  const params = useParams<{ id: string }>();
  const { accessToken, user } = useAuth();
  const [plan, setPlan] = useState<DeliveryPlanDetail | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [agentProfiles, setAgentProfiles] = useState<AgentProfile[]>([]);
  const [queue, setQueue] = useState<LpgRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const canAssign = user?.permissions.includes('delivery:assign') ?? false;
  const canReschedule = user?.permissions.includes('delivery:reschedule') ?? false;
  const canOverride = user?.permissions.includes('otp:manual-override') ?? false;

  const refetch = useCallback(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([getPlan(accessToken, params.id), listVehicles(accessToken), listAgentProfiles(accessToken), getDeliveryQueue(accessToken)])
      .then(([p, v, a, q]) => {
        setPlan(p);
        setVehicles(v);
        setAgentProfiles(a);
        setQueue(q);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load delivery plan.'))
      .finally(() => setLoading(false));
  }, [accessToken, params.id]);

  useEffect(refetch, [refetch]);

  if (loading && !plan) return <main><p className="hint">Loading…</p></main>;
  if (error && !plan) return <main><p className="error">{error}</p></main>;
  if (!plan) return null;

  const assignedVehicleIds = new Set(plan.vehicleAssignments.map((va) => va.vehicleId));
  const availableVehicles = vehicles.filter((v) => !assignedVehicleIds.has(v.id));

  return (
    <main>
      <div className="toolbar">
        <h1 style={{ marginRight: 'auto' }}>Delivery plan — {plan.planDate.slice(0, 10)}</h1>
        <span className="hint">{plan.status}</span>
      </div>
      {error && <p className="error">{error}</p>}

      {canAssign && availableVehicles.length > 0 && (
        <div className="card">
          <h2>Assign a vehicle</h2>
          <AssignVehicleForm vehicles={availableVehicles} agentProfiles={agentProfiles} planId={plan.id} onChanged={refetch} />
        </div>
      )}

      <div className="card-grid">
        {plan.vehicleAssignments.map((pv) => (
          <VehicleCard
            key={pv.id}
            planVehicle={pv}
            queue={queue}
            allPlanVehicles={plan.vehicleAssignments}
            canAssign={canAssign}
            canReschedule={canReschedule}
            canOverride={canOverride}
            onChanged={refetch}
          />
        ))}
      </div>

      {plan.vehicleAssignments.length === 0 && <p className="hint">No vehicles assigned to this plan yet.</p>}
    </main>
  );
}

function AssignVehicleForm({
  vehicles,
  agentProfiles,
  planId,
  onChanged,
}: {
  vehicles: Vehicle[];
  agentProfiles: AgentProfile[];
  planId: string;
  onChanged: () => void;
}) {
  const { accessToken } = useAuth();
  const [vehicleId, setVehicleId] = useState('');
  const [agentProfileId, setAgentProfileId] = useState('');
  const [cylindersLoaded, setCylindersLoaded] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken || !vehicleId) return;
    setError(null);
    setSubmitting(true);
    try {
      await assignVehicleToPlan(accessToken, planId, {
        vehicleId,
        agentProfileId: agentProfileId || undefined,
        cylindersLoaded: Number(cylindersLoaded) || 0,
      });
      setVehicleId('');
      setAgentProfileId('');
      setCylindersLoaded('');
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to assign vehicle.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="toolbar">
      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor="vehicleId">Vehicle</label>
        <select id="vehicleId" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required>
          <option value="">Select…</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.identifier}
            </option>
          ))}
        </select>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor="agentProfileId">Agent (optional)</label>
        <select id="agentProfileId" value={agentProfileId} onChange={(e) => setAgentProfileId(e.target.value)}>
          <option value="">Unassigned</option>
          {agentProfiles.map((a) => (
            <option key={a.id} value={a.id}>
              {a.user?.fullName ?? a.id}
            </option>
          ))}
        </select>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor="cylindersLoaded">Cylinders loaded</label>
        <input
          id="cylindersLoaded"
          type="number"
          min={0}
          value={cylindersLoaded}
          onChange={(e) => setCylindersLoaded(e.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={submitting}>
        {submitting ? 'Assigning…' : 'Assign vehicle'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

function VehicleCard({
  planVehicle,
  queue,
  allPlanVehicles,
  canAssign,
  canReschedule,
  canOverride,
  onChanged,
}: {
  planVehicle: DeliveryPlanVehicle;
  queue: LpgRequest[];
  allPlanVehicles: DeliveryPlanVehicle[];
  canAssign: boolean;
  canReschedule: boolean;
  canOverride: boolean;
  onChanged: () => void;
}) {
  const { accessToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cylindersRemaining, setCylindersRemaining] = useState(String(planVehicle.cylindersRemaining));
  const [requestId, setRequestId] = useState('');
  const stops = [...(planVehicle.stops ?? [])].sort((a, b) => (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0));

  async function withBusy(fn: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await fn();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  }

  async function onAdjustLoad(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    await withBusy(() => adjustVehicleLoad(accessToken, planVehicle.id, Number(cylindersRemaining)));
  }

  async function onAssignStop(e: FormEvent) {
    e.preventDefault();
    if (!accessToken || !requestId) return;
    await withBusy(async () => {
      await assignStop(accessToken, planVehicle.id, requestId);
      setRequestId('');
    });
  }

  function moveStop(stopId: string, direction: -1 | 1) {
    if (!accessToken) return;
    const ids = stops.map((s) => s.id);
    const idx = ids.indexOf(stopId);
    const swapWith = idx + direction;
    if (swapWith < 0 || swapWith >= ids.length) return;
    [ids[idx], ids[swapWith]] = [ids[swapWith], ids[idx]];
    withBusy(() => sequenceStops(accessToken, planVehicle.id, ids));
  }

  return (
    <div className="card">
      <h2>{planVehicle.vehicle?.identifier ?? 'Vehicle'}</h2>
      <p className="hint">Agent: {planVehicle.agentProfile?.user?.fullName ?? 'Unassigned'}</p>
      <p>
        Cylinders: {planVehicle.cylindersRemaining} remaining / {planVehicle.cylindersLoaded} loaded
      </p>
      {canAssign && (
        <form onSubmit={onAdjustLoad} className="toolbar">
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor={`load-${planVehicle.id}`}>Update remaining</label>
            <input
              id={`load-${planVehicle.id}`}
              type="number"
              min={0}
              value={cylindersRemaining}
              onChange={(e) => setCylindersRemaining(e.target.value)}
            />
          </div>
          <button type="submit" disabled={busy}>
            Update
          </button>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Beneficiary</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {stops.map((stop, idx) => (
            <StopRow
              key={stop.id}
              stop={stop}
              isFirst={idx === 0}
              isLast={idx === stops.length - 1}
              canAssign={canAssign}
              canReschedule={canReschedule}
              canOverride={canOverride}
              otherPlanVehicles={allPlanVehicles.filter((pv) => pv.id !== planVehicle.id)}
              onMove={(dir) => moveStop(stop.id, dir)}
              onChanged={onChanged}
            />
          ))}
        </tbody>
      </table>

      {canAssign && (
        <form onSubmit={onAssignStop} className="toolbar">
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor={`queue-${planVehicle.id}`}>Assign from queue</label>
            <select id={`queue-${planVehicle.id}`} value={requestId} onChange={(e) => setRequestId(e.target.value)}>
              <option value="">Select a queued request…</option>
              {queue.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.beneficiary?.name ?? r.id}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={busy || !requestId}>
            Add stop
          </button>
        </form>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

function StopRow({
  stop,
  isFirst,
  isLast,
  canAssign,
  canReschedule,
  canOverride,
  otherPlanVehicles,
  onMove,
  onChanged,
}: {
  stop: DeliveryStop;
  isFirst: boolean;
  isLast: boolean;
  canAssign: boolean;
  canReschedule: boolean;
  canOverride: boolean;
  otherPlanVehicles: DeliveryPlanVehicle[];
  onMove: (direction: -1 | 1) => void;
  onChanged: () => void;
}) {
  const { accessToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [giveUpReason, setGiveUpReason] = useState('');
  const canRescheduleThis = canReschedule && (stop.status === 'FAILED' || stop.status === 'CANCELLED');
  const canGiveUpThis = canReschedule && ['OTP_SEND_FAILED', 'OTP_VERIFY_FAILED'].includes(stop.status);
  const canOverrideThis = canOverride && ['OTP_SEND_FAILED', 'OTP_VERIFY_FAILED', 'FAILED'].includes(stop.status);

  async function onReschedule() {
    if (!accessToken || !rescheduleTarget) return;
    setError(null);
    setBusy(true);
    try {
      await rescheduleStop(accessToken, stop.id, rescheduleTarget);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reschedule stop.');
    } finally {
      setBusy(false);
    }
  }

  async function onGiveUp() {
    if (!accessToken || !giveUpReason.trim()) return;
    setError(null);
    setBusy(true);
    try {
      await giveUpOnStop(accessToken, stop.id, giveUpReason.trim());
      setGiveUpReason('');
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to give up on stop.');
    } finally {
      setBusy(false);
    }
  }

  async function onOverride() {
    if (!accessToken || !overrideReason.trim()) return;
    setError(null);
    setBusy(true);
    try {
      await manualOverride(accessToken, stop.id, overrideReason.trim());
      setOverrideReason('');
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to record manual override.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr>
      <td>
        {stop.sequenceNumber}
        {canAssign && (
          <span style={{ marginLeft: '0.5rem' }}>
            <button type="button" disabled={isFirst || busy} onClick={() => onMove(-1)}>
              ↑
            </button>{' '}
            <button type="button" disabled={isLast || busy} onClick={() => onMove(1)}>
              ↓
            </button>
          </span>
        )}
      </td>
      <td>{stop.delivery?.request.beneficiary?.name ?? <span className="hint">—</span>}</td>
      <td>
        <StatusBadge status={stop.status} />
      </td>
      <td>
        {error && <p className="error">{error}</p>}
        {canGiveUpThis && (
          <div className="toolbar" style={{ flexWrap: 'wrap' }}>
            <input
              placeholder="Reason for giving up"
              value={giveUpReason}
              onChange={(e) => setGiveUpReason(e.target.value)}
            />
            <button type="button" disabled={busy || !giveUpReason.trim()} onClick={onGiveUp}>
              Give up (enables reschedule)
            </button>
          </div>
        )}
        {canRescheduleThis && (
          <div className="toolbar" style={{ flexWrap: 'wrap' }}>
            <select value={rescheduleTarget} onChange={(e) => setRescheduleTarget(e.target.value)}>
              <option value="">Reschedule to vehicle…</option>
              {otherPlanVehicles.map((pv) => (
                <option key={pv.id} value={pv.id}>
                  {pv.vehicle?.identifier ?? pv.id}
                </option>
              ))}
            </select>
            <button type="button" disabled={busy || !rescheduleTarget} onClick={onReschedule}>
              Reschedule
            </button>
          </div>
        )}
        {canOverrideThis && (
          <div className="toolbar" style={{ flexWrap: 'wrap' }}>
            <input
              placeholder="Manual override reason"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
            />
            <button type="button" disabled={busy || !overrideReason.trim()} onClick={onOverride}>
              Confirm manually
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
