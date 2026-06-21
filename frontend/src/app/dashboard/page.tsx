'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { auth } from '@/lib/auth';
import type { DashboardResponse, RecentTicket } from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  Open:            'bg-blue-100 text-blue-700',
  InProgress:      'bg-yellow-100 text-yellow-700',
  WaitingCustomer: 'bg-orange-100 text-orange-700',
  Resolved:        'bg-green-100 text-green-700',
  Closed:          'bg-gray-100 text-gray-600',
  Cancelled:       'bg-red-100 text-red-600',
};

const PRIORITY_COLORS: Record<string, string> = {
  Low:      'bg-slate-100 text-slate-600',
  Medium:   'bg-blue-100 text-blue-700',
  High:     'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
};

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Metric card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: number;
  accent?: string;
  icon: React.ReactNode;
}

function MetricCard({ label, value, accent = 'text-gray-900', icon }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
      <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold leading-none mt-0.5 ${accent}`}>{value}</p>
      </div>
    </div>
  );
}

// ── Icons (inline SVG to avoid extra deps) ───────────────────────────────────

const icons = {
  total:    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  open:     <svg className="w-5 h-5 text-blue-500"   fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  progress: <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  resolved: <svg className="w-5 h-5 text-green-500"  fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  closed:   <svg className="w-5 h-5 text-gray-400"   fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" /></svg>,
  breached: <svg className="w-5 h-5 text-red-500"    fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  warning:  <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
};

// ── Recent tickets table ──────────────────────────────────────────────────────

function RecentTicketsTable({ tickets }: { tickets: RecentTicket[] }) {
  if (tickets.length === 0) {
    return <p className="text-sm text-gray-400 py-6 text-center">No tickets yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-3 pr-4">Title</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-3 pr-4">Status</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-3 pr-4">Priority</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {tickets.map(t => (
            <tr key={t.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 pr-4 text-gray-800 font-medium max-w-xs truncate">{t.title}</td>
              <td className="py-3 pr-4">
                <Badge label={t.status} colorClass={STATUS_COLORS[t.status] ?? 'bg-gray-100 text-gray-600'} />
              </td>
              <td className="py-3 pr-4">
                <Badge label={t.priority} colorClass={PRIORITY_COLORS[t.priority] ?? 'bg-gray-100 text-gray-600'} />
              </td>
              <td className="py-3 text-gray-500">{formatDate(t.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Dashboard page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData]       = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    try {
      const d = await apiClient.get<DashboardResponse>('/dashboard');
      setData(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!auth.isAuthenticated()) { router.replace('/login'); return; }
    load();
  }, [router, load]);

  function handleLogout() {
    auth.clear();
    router.replace('/login');
  }

  // ── Render states ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-medium mb-3">{error}</p>
          <button onClick={load} className="text-sm text-indigo-600 hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900 text-sm">ITSM Portal</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm font-medium text-indigo-600">Dashboard</Link>
              <Link href="/tickets" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Tickets</Link>
            </nav>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview of your tickets and SLA status</p>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <MetricCard label="Total"      value={data.totalTickets}        icon={icons.total}    />
          <MetricCard label="Open"       value={data.openTickets}         icon={icons.open}     accent="text-blue-700" />
          <MetricCard label="In Progress" value={data.inProgressTickets}  icon={icons.progress} accent="text-yellow-700" />
          <MetricCard label="Resolved"   value={data.resolvedTickets}     icon={icons.resolved} accent="text-green-700" />
          <MetricCard label="Closed"     value={data.closedTickets}       icon={icons.closed}   accent="text-gray-600" />
          <MetricCard label="SLA Breached" value={data.slaBreachedTickets} icon={icons.breached} accent="text-red-700" />
          <MetricCard label="SLA Warning" value={data.slaWarningSentTickets} icon={icons.warning} accent="text-orange-700" />
        </div>

        {/* Lower section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent tickets */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-5">Recent Tickets</h2>
            <RecentTicketsTable tickets={data.recentTickets} />
          </div>

          {/* Side panels */}
          <div className="space-y-6">
            {/* Priority breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">By Priority</h2>
              {data.byPriority.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No data</p>
              ) : (
                <ul className="space-y-2.5">
                  {data.byPriority.map(p => (
                    <li key={p.priority} className="flex items-center justify-between">
                      <Badge label={p.priority} colorClass={PRIORITY_COLORS[p.priority] ?? 'bg-gray-100 text-gray-600'} />
                      <span className="text-sm font-semibold text-gray-700">{p.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Agent breakdown (Admin only) */}
            {data.byAgent.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">By Agent</h2>
                <ul className="space-y-2.5">
                  {data.byAgent.map(a => (
                    <li key={a.agentName} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 truncate max-w-[140px]">{a.agentName}</span>
                      <span className="text-sm font-semibold text-gray-700">{a.ticketCount}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
