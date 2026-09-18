'use client';

import { FormEvent, useEffect, useState } from 'react';
import { RequireAuth } from '@/lib/require-auth';
import { useAuth } from '@/lib/auth-context';
import { generatePlan, listPlans } from '@/lib/api/delivery';
import { DeliveryPlan } from '@/lib/api/types';
import { ApiError } from '@/lib/api-client';

export default function DeliveryPlansPage() {
  return (
    <RequireAuth requiredPermission="delivery-plan:read">
      <DeliveryPlansContent />
    </RequireAuth>
  );
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function DeliveryPlansContent() {
  const { accessToken, user } = useAuth();
  const [plans, setPlans] = useState<DeliveryPlan[]>([]);
  const [planDate, setPlanDate] = useState(todayIsoDate());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  function refetch() {
    if (!accessToken) return;
    setLoading(true);
    listPlans(accessToken)
      .then(setPlans)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load delivery plans.'))
      .finally(() => setLoading(false));
  }

  useEffect(refetch, [accessToken]);

  async function onGenerate(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setSubmitting(true);
    try {
      const plan = await generatePlan(accessToken, planDate);
      window.location.href = `/delivery-plans/${plan.id}`;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create delivery plan.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <h1>Delivery plans</h1>
      <p className="hint">
        One plan per calendar day (REQ-024). Generating a plan for a date that already has one opens the existing
        plan instead of creating a duplicate.
      </p>

      {error && <p className="error">{error}</p>}

      {user?.permissions.includes('delivery-plan:create') && (
        <form onSubmit={onGenerate} className="toolbar">
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="planDate">Plan date</label>
            <input id="planDate" type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} required />
          </div>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Opening…' : 'Open / create plan'}
          </button>
        </form>
      )}

      {loading && <p className="hint">Loading…</p>}

      {plans.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="clickable" onClick={() => (window.location.href = `/delivery-plans/${p.id}`)}>
                <td>{p.planDate.slice(0, 10)}</td>
                <td>{p.status}</td>
                <td>{new Date(p.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
