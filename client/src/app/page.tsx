'use client';

import { useState } from 'react';
import { checkServerHealth, HealthCheckResponse } from '@/services/health.service';

const ROLES = [
  { name: 'Admin', color: 'bg-red-500/10 text-red-600 border-red-200' },
  { name: 'Project Manager', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  { name: 'Site Engineer', color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  { name: 'Finance Manager', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
  { name: 'Contractor', color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
];

const MODULES = [
  'Dashboard',
  'Projects',
  'Tasks',
  'Budget',
  'Expenses',
  'Materials',
  'Contractors',
  'Progress Reports',
  'Analytics',
  'Users',
];

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const probeBackend = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await checkServerHealth();
      setHealthStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backend unreachable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-8 sm:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <header className="border-b border-neutral-200 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500">Stage 1 Initialized</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1">BuildTrack</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Construction Project Management &amp; Financial Tracking Platform
            </p>
          </div>
          <div className="text-xs text-neutral-500 font-mono bg-neutral-100 px-3 py-2 rounded-md border border-neutral-200">
            Client: <span className="text-neutral-800 font-semibold">:3000</span> | Server: <span className="text-neutral-800 font-semibold">:5000</span>
          </div>
        </header>

        {/* Architecture Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Frontend Spec */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-neutral-800">
              <span className="px-2 py-0.5 text-xs bg-neutral-100 text-neutral-700 rounded border border-neutral-200 font-mono">client/</span>
              Frontend Stack
            </h2>
            <ul className="text-sm space-y-2 text-neutral-600">
              <li className="flex items-center gap-2">✓ Next.js App Router (TypeScript)</li>
              <li className="flex items-center gap-2">✓ Tailwind CSS</li>
              <li className="flex items-center gap-2">✓ shadcn/ui base structure</li>
              <li className="flex items-center gap-2">✓ Axios API Client with Interceptors</li>
            </ul>
          </div>

          {/* Backend Spec */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-neutral-800">
              <span className="px-2 py-0.5 text-xs bg-neutral-100 text-neutral-700 rounded border border-neutral-200 font-mono">server/</span>
              Backend Stack
            </h2>
            <ul className="text-sm space-y-2 text-neutral-600">
              <li className="flex items-center gap-2">✓ Node.js &amp; Express.js (TypeScript)</li>
              <li className="flex items-center gap-2">✓ MongoDB &amp; Mongoose ODM</li>
              <li className="flex items-center gap-2">✓ Strict CORS whitelist communication</li>
              <li className="flex items-center gap-2">✓ Layered Architecture (Controllers, Services, Models)</li>
            </ul>
          </div>
        </div>

        {/* Roles */}
        <section className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Supported System Roles (5)</h3>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <span
                key={r.name}
                className={`text-xs px-3 py-1 rounded-full font-medium border ${r.color}`}
              >
                {r.name}
              </span>
            ))}
          </div>
        </section>

        {/* Modules */}
        <section className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Core Modules (10)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {MODULES.map((m) => (
              <div key={m} className="bg-neutral-50 border border-neutral-200 p-2.5 rounded text-neutral-700 font-medium text-center">
                {m}
              </div>
            ))}
          </div>
        </section>

        {/* Client-Server Communication Probe */}
        <section className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-neutral-800">Backend Communication Test</h3>
              <p className="text-xs text-neutral-500">
                Tests CORS, HTTP request routing, and server health from <code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-700">apiClient</code> to <code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-700">/api/v1/health</code>.
              </p>
            </div>
            <button
              onClick={probeBackend}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Checking...' : 'Probe Backend'}
            </button>
          </div>

          {healthStatus && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1 font-mono text-emerald-900">
              <div className="font-bold text-emerald-800">✓ Backend Responded Successfully</div>
              <div>Status: {healthStatus.status}</div>
              <div>Message: {healthStatus.message}</div>
              <div>Environment: {healthStatus.environment}</div>
              <div>Timestamp: {healthStatus.timestamp}</div>
              {healthStatus.database && (
                <div>Database Status: {healthStatus.database.status} (readyState: {healthStatus.database.readyState})</div>
              )}
            </div>
          )}

          {error && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1 font-mono text-amber-900">
              <div className="font-bold text-amber-800">Backend probe status:</div>
              <div>{error}</div>
              <div className="text-neutral-500 mt-1 font-sans">
                (Note: Start the server with <code>npm run dev</code> inside <code>server/</code> to test live responses.)
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
