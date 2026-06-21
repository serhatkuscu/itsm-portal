'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { auth } from '@/lib/auth';
import { StatusBadge, PriorityBadge } from '@/components/Badge';
import type { PagedResult, TicketListItem } from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function isDueDateWarning(iso: string): boolean {
  const due = new Date(iso);
  const now = new Date();
  const diffH = (due.getTime() - now.getTime()) / 3_600_000;
  return diffH > 0 && diffH <= 1;
}

function isDueDateBreached(iso: string): boolean {
  return new Date(iso) < new Date();
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

function TicketsPageContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const currentPage  = Number(searchParams.get('page') ?? '1');

  const [result, setResult]   = useState<PagedResult<TicketListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = useCallback(async (page: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.get<PagedResult<TicketListItem>>(
        `/tickets?page=${page}&pageSize=20`
      );
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!auth.isAuthenticated()) { router.replace('/login'); return; }
    load(currentPage);
  }, [router, load, currentPage]);

  function goToPage(p: number) {
    router.push(`/tickets?page=${p}`);
  }

  // ── Render ──
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">
                ITSM Portal
              </span>
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-500">Tickets</span>
          </div>
          <button
            onClick={() => { auth.clear(); router.replace('/login'); }}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Tickets</h1>
            {result && (
              <p className="text-sm text-gray-500 mt-0.5">
                {result.totalCount} ticket{result.totalCount !== 1 ? 's' : ''} total
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-24">
            <p className="text-red-500 font-medium mb-3">{error}</p>
            <button onClick={() => load(currentPage)} className="text-sm text-indigo-600 hover:underline">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && result && (
          <>
            {result.items.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
                <p className="text-gray-400 text-sm">No tickets found.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Title', 'Status', 'Priority', 'Assigned Agent', 'Due Date', 'Created'].map(col => (
                          <th
                            key={col}
                            className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.items.map(ticket => {
                        const breached = ticket.isSlaBreached || isDueDateBreached(ticket.dueDate);
                        const warning  = !breached && isDueDateWarning(ticket.dueDate);

                        return (
                          <tr
                            key={ticket.id}
                            onClick={() => router.push(`/tickets/${ticket.id}`)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <td className="px-5 py-3.5 max-w-xs">
                              <span className="font-medium text-gray-900 truncate block">{ticket.title}</span>
                              <span className="text-xs text-gray-400">{ticket.requesterName}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <StatusBadge status={ticket.status} />
                            </td>
                            <td className="px-5 py-3.5">
                              <PriorityBadge priority={ticket.priority} />
                            </td>
                            <td className="px-5 py-3.5 text-gray-600">
                              {ticket.assignedToName ?? (
                                <span className="text-gray-300 italic">Unassigned</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={
                                  breached ? 'text-red-600 font-medium' :
                                  warning  ? 'text-orange-500 font-medium' :
                                  'text-gray-600'
                                }
                              >
                                {formatDateTime(ticket.dueDate)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-gray-500">
                              {formatDate(ticket.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              onPage={goToPage}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TicketsPageContent />
    </Suspense>
  );
}
