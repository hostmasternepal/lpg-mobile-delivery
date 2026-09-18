'use client';

import { FormEvent, useEffect, useState } from 'react';
import { RequireAuth } from '@/lib/require-auth';
import { useAuth } from '@/lib/auth-context';
import { createVehicle, listVehicles } from '@/lib/api/delivery';
import { Vehicle } from '@/lib/api/types';
import { ApiError } from '@/lib/api-client';

export default function VehiclesPage() {
  return (
    <RequireAuth requiredPermission="delivery-plan:read">
      <VehiclesContent />
    </RequireAuth>
  );
}

function VehiclesContent() {
  const { accessToken, user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function refetch() {
    if (!accessToken) return;
    setLoading(true);
    listVehicles(accessToken)
      .then(setVehicles)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load vehicles.'))
      .finally(() => setLoading(false));
  }

  useEffect(refetch, [accessToken]);

  return (
    <main>
      <h1>Fleet</h1>
      {error && <p className="error">{error}</p>}
      {loading && <p className="hint">Loading…</p>}

      <div className="card-grid">
        <div className="card">
          <h2>Vehicles</h2>
          <table>
            <thead>
              <tr>
                <th>Identifier</th>
                <th>Capacity (cylinders)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td>{v.identifier}</td>
                  <td>{v.capacityCylinders ?? <span className="hint">unknown</span>}</td>
                  <td>{v.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {user?.permissions.includes('delivery:assign') && (
          <div className="card">
            <h2>Add vehicle</h2>
            <CreateVehicleForm onCreated={refetch} />
          </div>
        )}
      </div>
    </main>
  );
}

function CreateVehicleForm({ onCreated }: { onCreated: () => void }) {
  const { accessToken } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [capacityCylinders, setCapacityCylinders] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setSubmitting(true);
    try {
      await createVehicle(accessToken, {
        identifier,
        capacityCylinders: capacityCylinders ? Number(capacityCylinders) : undefined,
      });
      setIdentifier('');
      setCapacityCylinders('');
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add vehicle.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="identifier">Identifier (plate no.)</label>
        <input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="capacity">Capacity (cylinders, optional)</label>
        <input
          id="capacity"
          type="number"
          min={1}
          value={capacityCylinders}
          onChange={(e) => setCapacityCylinders(e.target.value)}
        />
        <p className="hint">Fleet capacity figures are not yet confirmed (OPEN-BUSINESS-DECISION-10) — leave blank if unknown.</p>
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? 'Adding…' : 'Add vehicle'}
      </button>
    </form>
  );
}
