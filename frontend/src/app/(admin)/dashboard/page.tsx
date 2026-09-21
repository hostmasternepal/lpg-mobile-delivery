'use client';

import { useEffect, useState } from 'react';
import { RequireAuth } from '@/lib/require-auth';
import { useAuth } from '@/lib/auth-context';
import { getDailyDistribution, getDistrictDemand, getSummary } from '@/lib/api/dashboard';
import { DailyDistribution, DashboardSummary, DistrictDemand } from '@/lib/api/types';
import { ApiError } from '@/lib/api-client';

export default function DashboardPage() {
  return (
    <RequireAuth requiredPermission="dashboard:read">
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const { accessToken, user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [districts, setDistricts] = useState<DistrictDemand[]>([]);
  const [daily, setDaily] = useState<DailyDistribution[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const canReadReports = user?.permissions.includes('report:read') ?? false;

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([
      getSummary(accessToken),
      getDistrictDemand(accessToken),
      canReadReports ? getDailyDistribution(accessToken) : Promise.resolve([]),
    ])
      .then(([s, d, dd]) => {
        setSummary(s);
        setDistricts(d);
        setDaily(dd);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, [accessToken, canReadReports]);

  return (
    <main>
      <h1>Dashboard</h1>
      <p className="hint">REQ-029 metrics — current snapshot counts (see docs/ARCHITECTURE.md for the counting rule).</p>

      {error && <p className="error">{error}</p>}
      {loading && <p className="hint">Loading…</p>}

      {summary && (
        <>
          <div className="card-grid">
            <StatTile label="Total requests" value={summary.totalRequests} />
            <StatTile label="Verified or later" value={summary.verifiedRequests} />
            <StatTile label="With priority group" value={summary.priorityRequests} />
            <StatTile label="Shortlisted" value={summary.shortlistedRequests} />
            <StatTile label="Delivery planned" value={summary.deliveryPlanned} />
            <StatTile label="Delivery in progress" value={summary.deliveryInProgress} />
            <StatTile label="Delivered" value={summary.delivered} />
            <StatTile label="Pending / rejected" value={summary.pendingOrRejected} />
          </div>

          <div className="card-grid">
            <div className="card">
              <h2>By source channel</h2>
              <table>
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.sourceBreakdown.map((s) => (
                    <tr key={s.sourceChannel}>
                      <td>{s.sourceChannel}</td>
                      <td>{s.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h2>By district</h2>
              <table>
                <thead>
                  <tr>
                    <th>District</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {districts.map((d) => (
                    <tr key={d.district}>
                      <td>{d.district}</td>
                      <td>{d.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {canReadReports && (
              <div className="card">
                <h2>Deliveries per day</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Delivered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daily.map((d) => (
                      <tr key={d.date}>
                        <td>{new Date(d.date).toLocaleDateString()}</td>
                        <td>{d.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-tile">
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}
