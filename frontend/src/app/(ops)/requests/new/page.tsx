'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { RequireAuth } from '@/lib/require-auth';
import { createRequest } from '@/lib/api/requests';
import { SOURCE_CHANNELS, SourceChannel } from '@/lib/api/types';
import { ApiError } from '@/lib/api-client';

export default function NewRequestPage() {
  return (
    <RequireAuth requiredPermission="request:create">
      <NewRequestForm />
    </RequireAuth>
  );
}

function NewRequestForm() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [sourceChannel, setSourceChannel] = useState<SourceChannel>('HELLO_SARKAR');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [addressText, setAddressText] = useState('');
  const [lpgNeedDescription, setLpgNeedDescription] = useState('');
  const [familyGroupStatus, setFamilyGroupStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setSubmitting(true);
    try {
      const created = await createRequest(accessToken, {
        sourceChannel,
        beneficiaryName: beneficiaryName || undefined,
        mobileNumber: mobileNumber || undefined,
        addressText: addressText || undefined,
        location: district ? { district } : undefined,
        lpgNeedDescription: lpgNeedDescription || undefined,
        familyGroupStatus: familyGroupStatus || undefined,
      });
      router.push(`/requests/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="narrow">
      <h1>New request</h1>
      <p className="hint">
        Every field except source is optional (REQ-018 — record whatever information is available).
      </p>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="source">Source *</label>
          <select id="source" value={sourceChannel} onChange={(e) => setSourceChannel(e.target.value as SourceChannel)}>
            {SOURCE_CHANNELS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="name">Beneficiary name</label>
          <input id="name" value={beneficiaryName} onChange={(e) => setBeneficiaryName(e.target.value)} />
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="mobile">Mobile number</label>
            <input id="mobile" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="district">District</label>
            <input id="district" value={district} onChange={(e) => setDistrict(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="address">Address</label>
          <input id="address" value={addressText} onChange={(e) => setAddressText(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="need">LPG need / problem</label>
          <textarea id="need" value={lpgNeedDescription} onChange={(e) => setLpgNeedDescription(e.target.value)} rows={3} />
        </div>
        <div className="field">
          <label htmlFor="family">Family/group status</label>
          <input id="family" value={familyGroupStatus} onChange={(e) => setFamilyGroupStatus(e.target.value)} />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create request'}
        </button>
      </form>
    </main>
  );
}
