'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StatusBadge } from '@/components/status-badge';
import { useAuth } from '@/lib/auth-context';
import { RequireAuth } from '@/lib/require-auth';
import { ApiError } from '@/lib/api-client';
import { getRequest, updateRequest } from '@/lib/api/requests';
import { getDuplicateCandidates, getVerificationHistory, recordVerification } from '@/lib/api/verification';
import {
  assessPriority,
  getGroupsForRequest,
  getPriorityOverrideHistory,
  listPriorityGroups,
  overridePriority,
} from '@/lib/api/priority';
import { queueRequest, shortlistRequest } from '@/lib/api/delivery';
import {
  LpgRequest,
  PriorityGroup,
  PriorityGroupCode,
  PriorityOverride,
  RequestPriorityGroup,
  Verification,
} from '@/lib/api/types';

export default function RequestDetailPage() {
  return (
    <RequireAuth requiredPermission="request:read">
      <RequestDetailContent />
    </RequireAuth>
  );
}

function RequestDetailContent() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, user } = useAuth();
  const [request, setRequest] = useState<LpgRequest | null>(null);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [duplicates, setDuplicates] = useState<LpgRequest[]>([]);
  const [groups, setGroups] = useState<RequestPriorityGroup[]>([]);
  const [overrides, setOverrides] = useState<PriorityOverride[]>([]);
  const [allGroups, setAllGroups] = useState<PriorityGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!accessToken) return;
    setError(null);
    try {
      const [req, verifs, dupes, grps, overrideHistory, allGrps] = await Promise.all([
        getRequest(accessToken, id),
        getVerificationHistory(accessToken, id),
        user?.permissions.includes('request:verify') ? getDuplicateCandidates(accessToken, id) : Promise.resolve([]),
        getGroupsForRequest(accessToken, id),
        getPriorityOverrideHistory(accessToken, id),
        listPriorityGroups(accessToken),
      ]);
      setRequest(req);
      setVerifications(verifs);
      setDuplicates(dupes);
      setGroups(grps);
      setOverrides(overrideHistory);
      setAllGroups(allGrps);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load request.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  if (loading) return <main>Loading…</main>;
  if (error && !request) return <main className="error">{error}</main>;
  if (!request) return null;

  return (
    <main>
      <div className="toolbar">
        <h1 style={{ marginRight: 'auto' }}>{request.beneficiary?.name ?? 'Unnamed beneficiary'}</h1>
        <StatusBadge status={request.status} />
      </div>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h3>Details</h3>
        <p>
          <strong>Mobile:</strong> {request.beneficiary?.mobileNumber ?? '—'} &nbsp;
          <strong>District:</strong> {request.beneficiary?.location?.district ?? '—'} &nbsp;
          <strong>Source:</strong> {request.sourceChannel}
        </p>
        <p>
          <strong>Address:</strong> {request.beneficiary?.addressText ?? '—'}
        </p>
        <p>
          <strong>LPG need:</strong> {request.lpgNeedDescription ?? '—'}
        </p>
        <p>
          <strong>Family/group status:</strong> {request.familyGroupStatus ?? '—'}
        </p>
        <p className="hint">Created {new Date(request.createdAt).toLocaleString()} &middot; version {request.version}</p>
      </div>

      {duplicates.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--warn)' }}>
          <h3>Possible duplicates</h3>
          <p className="hint">Other requests sharing this beneficiary&apos;s phone number:</p>
          <ul>
            {duplicates.map((d) => (
              <li key={d.id}>
                <a href={`/requests/${d.id}`}>{d.id.slice(0, 8)}</a> — <StatusBadge status={d.status} /> —{' '}
                {new Date(d.createdAt).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      <LifecycleActions request={request} onChanged={refetch} />

      <VerificationSection
        request={request}
        verifications={verifications}
        onChanged={refetch}
        canVerify={Boolean(user?.permissions.includes('request:verify'))}
      />

      <PrioritySection
        request={request}
        groups={groups}
        overrides={overrides}
        allGroups={allGroups}
        onChanged={refetch}
        canClassify={Boolean(user?.permissions.includes('request:classify-priority'))}
      />

      {user?.permissions.includes('request:update') && <EditForm request={request} onChanged={refetch} />}
    </main>
  );
}

function LifecycleActions({ request, onChanged }: { request: LpgRequest; onChanged: () => void }) {
  const { accessToken, user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: 'shortlist' | 'queue') {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      if (action === 'shortlist') await shortlistRequest(accessToken, request.id, request.version);
      else await queueRequest(accessToken, request.id, request.version);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  }

  const canShortlist = user?.permissions.includes('request:shortlist') && request.status === 'VERIFIED';
  const canQueue = user?.permissions.includes('request:queue') && request.status === 'SHORTLISTED';

  if (!canShortlist && !canQueue) return null;

  return (
    <div className="card">
      <h3>Delivery pipeline</h3>
      {error && <p className="error">{error}</p>}
      <div className="toolbar">
        {canShortlist && (
          <button disabled={busy} onClick={() => run('shortlist')}>
            Shortlist
          </button>
        )}
        {canQueue && (
          <button disabled={busy} onClick={() => run('queue')}>
            Move to delivery queue
          </button>
        )}
      </div>
    </div>
  );
}

function VerificationSection({
  request,
  verifications,
  onChanged,
  canVerify,
}: {
  request: LpgRequest;
  verifications: Verification[];
  onChanged: () => void;
  canVerify: boolean;
}) {
  const { accessToken } = useAuth();
  const [method, setMethod] = useState<'PHONE' | 'OTHER'>('PHONE');
  const [outcome, setOutcome] = useState<'CONFIRMED' | 'FAILED'>('CONFIRMED');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      await recordVerification(accessToken, request.id, { method, outcome, notes: notes || undefined, expectedVersion: request.version });
      setNotes('');
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verification failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h3>Verification</h3>
      {verifications.length === 0 && <p className="hint">No verification attempts yet.</p>}
      {verifications.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Outcome</th>
              <th>Notes</th>
              <th>By</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {verifications.map((v) => (
              <tr key={v.id}>
                <td>{v.method}</td>
                <td>
                  <StatusBadge status={v.outcome.code} />
                </td>
                <td>{v.notes ?? '—'}</td>
                <td>{v.verifiedBy?.fullName ?? '—'}</td>
                <td>{new Date(v.verifiedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {canVerify && request.status === 'RECORDED' && (
        <>
          <h4>Record a verification attempt</h4>
          <div className="form-row">
            <div className="field">
              <label>Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value as 'PHONE' | 'OTHER')}>
                <option value="PHONE">Phone</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="field">
              <label>Outcome</label>
              <select value={outcome} onChange={(e) => setOutcome(e.target.value as 'CONFIRMED' | 'FAILED')}>
                <option value="CONFIRMED">Confirmed</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && <p className="error">{error}</p>}
          <button disabled={busy} onClick={onSubmit}>
            {busy ? 'Submitting…' : 'Submit'}
          </button>
        </>
      )}
    </div>
  );
}

const PRIORITY_CODES: PriorityGroupCode[] = [
  'EXTREME_POVERTY',
  'STUDENT',
  'MARGINALIZED_AT_RISK',
  'SENIOR_CITIZEN',
  'PERSON_WITH_DISABILITY',
  'WOMEN_HEADED_POOR_FAMILY',
  'ESSENTIAL_SERVICE',
  'OTHER_HUMANITARIAN_NEED',
];

function PrioritySection({
  request,
  groups,
  overrides,
  allGroups,
  onChanged,
  canClassify,
}: {
  request: LpgRequest;
  groups: RequestPriorityGroup[];
  overrides: PriorityOverride[];
  allGroups: PriorityGroup[];
  onChanged: () => void;
  canClassify: boolean;
}) {
  const { accessToken } = useAuth();
  const [selected, setSelected] = useState<Set<PriorityGroupCode>>(new Set());
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labelFor = (code: string) => allGroups.find((g) => g.code === code)?.labelEn ?? code;

  function toggle(code: PriorityGroupCode) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  async function onAssess() {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      await assessPriority(accessToken, request.id, Array.from(selected));
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Assessment failed.');
    } finally {
      setBusy(false);
    }
  }

  async function onOverride() {
    if (!accessToken) return;
    if (!reason.trim()) {
      setError('A reason is required to override.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await overridePriority(accessToken, request.id, { newGroupCodes: Array.from(selected), reason });
      setReason('');
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Override failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h3>Priority classification</h3>
      <p>
        {groups.length === 0 ? (
          <span className="hint">No priority group assigned.</span>
        ) : (
          groups.map((g) => (
            <span key={g.priorityGroupId} className="badge badge-neutral" style={{ marginRight: '0.4rem' }}>
              {g.priorityGroup.labelEn}
            </span>
          ))
        )}
      </p>

      {canClassify && request.status !== 'RECORDED' && (
        <>
          <h4>Assign / override groups</h4>
          <div className="toolbar" style={{ flexWrap: 'wrap' }}>
            {PRIORITY_CODES.map((code) => (
              <label key={code} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                <input type="checkbox" checked={selected.has(code)} onChange={() => toggle(code)} />
                {labelFor(code)}
              </label>
            ))}
          </div>
          {error && <p className="error">{error}</p>}
          <div className="toolbar">
            <button disabled={busy} onClick={onAssess}>
              Assess (adds rule matches + checked groups)
            </button>
          </div>
          <div className="field">
            <label>Override reason (replaces the group set outright — mandatory)</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <button disabled={busy} className="secondary" onClick={onOverride}>
            Override with checked groups
          </button>
        </>
      )}

      {overrides.length > 0 && (
        <>
          <h4>Override history</h4>
          <table>
            <thead>
              <tr>
                <th>Reason</th>
                <th>By</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {overrides.map((o) => (
                <tr key={o.id}>
                  <td>{o.reason}</td>
                  <td>{o.actor.fullName}</td>
                  <td>{new Date(o.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function EditForm({ request, onChanged }: { request: LpgRequest; onChanged: () => void }) {
  const { accessToken } = useAuth();
  const [lpgNeedDescription, setLpgNeedDescription] = useState(request.lpgNeedDescription ?? '');
  const [familyGroupStatus, setFamilyGroupStatus] = useState(request.familyGroupStatus ?? '');
  const [mobileNumber, setMobileNumber] = useState(request.beneficiary?.mobileNumber ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit() {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await updateRequest(accessToken, request.id, {
        lpgNeedDescription: lpgNeedDescription || undefined,
        familyGroupStatus: familyGroupStatus || undefined,
        mobileNumber: mobileNumber || undefined,
      });
      setSaved(true);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h3>Edit</h3>
      <div className="field">
        <label>Mobile number</label>
        <input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
      </div>
      <div className="field">
        <label>LPG need</label>
        <input value={lpgNeedDescription} onChange={(e) => setLpgNeedDescription(e.target.value)} />
      </div>
      <div className="field">
        <label>Family/group status</label>
        <input value={familyGroupStatus} onChange={(e) => setFamilyGroupStatus(e.target.value)} />
      </div>
      {error && <p className="error">{error}</p>}
      {saved && <p className="hint">Saved.</p>}
      <button className="secondary" disabled={busy} onClick={onSubmit}>
        Save changes
      </button>
    </div>
  );
}
