'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api-client';
import { auth } from '@/lib/auth';
import { StatusBadge, PriorityBadge } from '@/components/Badge';
import type { TicketDetail, CommentDetail, AuditDetail, AgentOption } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Status transitions available per current status (Admin/Agent only)
// endpoint: 'status' → POST /tickets/{id}/status
// endpoint: 'close'  → POST /tickets/{id}/close
const STATUS_ACTIONS: Record<string, { label: string; status: number; endpoint: 'status' | 'close'; color: string }[]> = {
  Open:            [{ label: 'Start Working',       status: 2, endpoint: 'status', color: 'bg-yellow-500 hover:bg-yellow-600' }],
  InProgress:      [
    { label: 'Wait for Customer', status: 3, endpoint: 'status', color: 'bg-orange-500 hover:bg-orange-600' },
    { label: 'Mark Resolved',     status: 4, endpoint: 'status', color: 'bg-green-600  hover:bg-green-700'  },
  ],
  WaitingCustomer: [{ label: 'Resume Working',      status: 2, endpoint: 'status', color: 'bg-yellow-500 hover:bg-yellow-600' }],
  Resolved:        [{ label: 'Close Ticket',         status: 5, endpoint: 'close',  color: 'bg-gray-700   hover:bg-gray-800'   }],
};

// ── Sub-components ────────────────────────────────────────────────────────────

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide w-28 shrink-0 pt-0.5">{label}</span>
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  );
}

function SlaIndicator({ dueDate, isBreached }: { dueDate: string; isBreached: boolean }) {
  if (isBreached) {
    return (
      <span className="inline-flex items-center gap-1 text-red-600 font-medium text-sm">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        SLA Breached
      </span>
    );
  }
  const diffMs = new Date(dueDate).getTime() - Date.now();
  const diffH  = diffMs / 3_600_000;
  if (diffH > 0 && diffH <= 1) {
    return (
      <span className="inline-flex items-center gap-1 text-orange-500 font-medium text-sm">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        Due in {Math.round(diffMs / 60000)} min
      </span>
    );
  }
  return <span className="text-gray-700">{formatDateTime(dueDate)}</span>;
}

function CommentsPanel({ comments }: { comments: CommentDetail[] }) {
  if (comments.length === 0)
    return <p className="text-sm text-gray-400 py-4 text-center">No comments yet.</p>;
  return (
    <ul className="space-y-4">
      {comments.map(c => (
        <li key={c.id} className="flex gap-3">
          <div className="shrink-0 w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700">
            {c.authorName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-gray-700">{c.authorName}</span>
              {c.isInternal && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">Internal</span>
              )}
              <span className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function AuditPanel({ logs }: { logs: AuditDetail[] }) {
  if (logs.length === 0)
    return <p className="text-sm text-gray-400 py-4 text-center">No audit logs.</p>;
  return (
    <ul>
      {logs.map((log, i) => (
        <li key={i} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
          <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-700">{log.action}</span>
              {log.field && <span className="text-xs text-gray-400">({log.field})</span>}
              <span className="text-xs text-gray-400 ml-auto">{formatDateTime(log.createdAt)}</span>
            </div>
            {(log.oldValue || log.newValue) && (
              <div className="flex items-center gap-2 mt-1 text-xs">
                {log.oldValue && <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-mono">{log.oldValue}</span>}
                {log.oldValue && log.newValue && (
                  <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
                {log.newValue && <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-mono">{log.newValue}</span>}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── Actions Panel ─────────────────────────────────────────────────────────────

interface ActionsPanelProps {
  ticket:          TicketDetail;
  agents:          AgentOption[];
  role:            string;
  userId:          string;
  actionLoading:   boolean;
  successMsg:      string;
  actionError:     string;
  onAssign:        (agentId: string) => void;
  onChangeStatus:  (status: number, endpoint: 'status' | 'close') => void;
}

function ActionsPanel({
  ticket, agents, role, userId,
  actionLoading, successMsg, actionError,
  onAssign, onChangeStatus,
}: ActionsPanelProps) {
  const [selectedAgent, setSelectedAgent] = useState('');
  const isClosed    = ticket.status === 'Closed' || ticket.status === 'Cancelled';
  const isAdmin     = role === 'Admin';
  const isAgent     = role === 'Agent';
  const isRequester = role === 'Requester';
  const isOwnTicket = ticket.requesterName !== undefined; // always true; ownership checked via userId vs requesterId

  const statusActions = STATUS_ACTIONS[ticket.status] ?? [];
  const canDoStatusActions = (isAdmin || isAgent) && !isClosed;
  const canClose  = isRequester && !isClosed;   // Requester: close own ticket
  const canAssign = isAdmin && !isClosed;

  // Nothing to show
  if (!canDoStatusActions && !canClose && !canAssign && !successMsg && !actionError) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Actions</h2>

      {/* Feedback messages */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMsg}
        </div>
      )}
      {actionError && (
        <div className="mb-4 flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {actionError}
        </div>
      )}

      <div className="space-y-4">
        {/* Assign Agent — Admin only */}
        {canAssign && agents.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Assign Agent</p>
            <div className="flex gap-2">
              <select
                value={selectedAgent}
                onChange={e => setSelectedAgent(e.target.value)}
                disabled={actionLoading}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="">Select agent…</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.fullName}</option>
                ))}
              </select>
              <button
                onClick={() => selectedAgent && onAssign(selectedAgent)}
                disabled={!selectedAgent || actionLoading}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading ? '…' : 'Assign'}
              </button>
            </div>
          </div>
        )}

        {/* Status transitions — Admin/Agent */}
        {canDoStatusActions && statusActions.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Change Status</p>
            <div className="flex flex-wrap gap-2">
              {statusActions.map(action => (
                <button
                  key={action.status}
                  onClick={() => onChangeStatus(action.status, action.endpoint)}
                  disabled={actionLoading}
                  className={`px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${action.color}`}
                >
                  {actionLoading ? '…' : action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Close — Requester only */}
        {canClose && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Close Request</p>
            <button
              onClick={() => onChangeStatus(5, 'close')}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-gray-700 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {actionLoading ? 'Closing…' : 'Close Ticket'}
            </button>
          </div>
        )}

        {isClosed && (
          <p className="text-sm text-gray-400 italic">This ticket is in a terminal state — no further actions available.</p>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [ticket,        setTicket]        = useState<TicketDetail | null>(null);
  const [agents,        setAgents]        = useState<AgentOption[]>([]);
  const [userInfo,      setUserInfo]      = useState<{ id: string; role: string } | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg,    setSuccessMsg]    = useState('');
  const [actionError,   setActionError]   = useState('');

  const load = useCallback(async () => {
    try {
      const data = await apiClient.get<TicketDetail>(`/tickets/${params.id}`);
      setTicket(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (!auth.isAuthenticated()) { router.replace('/login'); return; }
    const info = auth.getUserInfo();
    setUserInfo(info ? { id: info.id, role: info.role } : null);
    load();
    if (info?.role === 'Admin') {
      apiClient.get<AgentOption[]>('/users/agents')
        .then(setAgents)
        .catch(() => {});
    }
  }, [router, load]);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setActionError('');
    setTimeout(() => setSuccessMsg(''), 3000);
  }

  async function handleAction(call: () => Promise<unknown>, successText: string) {
    setActionLoading(true);
    setActionError('');
    setSuccessMsg('');
    try {
      await call();
      showSuccess(successText);
      await load();              // refresh ticket
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Action failed';
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  }

  function handleAssign(agentId: string) {
    handleAction(
      () => apiClient.post(`/tickets/${params.id}/assign`, { agentId }),
      'Agent assigned successfully.',
    );
  }

  function handleChangeStatus(status: number, endpoint: 'status' | 'close') {
    const path    = endpoint === 'close' ? `/tickets/${params.id}/close` : `/tickets/${params.id}/status`;
    const body    = endpoint === 'close' ? { status } : { status };
    const success = endpoint === 'close' ? 'Ticket closed.' : 'Status updated.';
    handleAction(() => apiClient.post(path, body), success);
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
          <button onClick={load} className="text-sm text-indigo-600 hover:underline mr-4">Retry</button>
          <Link href="/tickets" className="text-sm text-gray-500 hover:underline">Back to list</Link>
        </div>
      </div>
    );
  }
  if (!ticket) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">ITSM Portal</span>
            </Link>
            <span className="text-gray-300">/</span>
            <Link href="/tickets" className="text-gray-500 hover:text-gray-900 transition-colors">Tickets</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-500 truncate max-w-[180px]">{ticket.title}</span>
          </nav>
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
        {/* Title row */}
        <div className="mb-6 flex items-start gap-3">
          <Link href="/tickets" className="shrink-0 mt-1 p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors" title="Back">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{ticket.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              {ticket.isSlaBreached && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-700">
                  SLA Breached
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Metadata */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Details</h2>
              <MetaRow label="Status"><StatusBadge status={ticket.status} /></MetaRow>
              <MetaRow label="Priority"><PriorityBadge priority={ticket.priority} /></MetaRow>
              <MetaRow label="Requester">{ticket.requesterName}</MetaRow>
              <MetaRow label="Agent">
                {ticket.assignedToName ?? <span className="text-gray-400 italic">Unassigned</span>}
              </MetaRow>
              <MetaRow label="Due Date">
                <SlaIndicator dueDate={ticket.dueDate} isBreached={ticket.isSlaBreached} />
              </MetaRow>
              <MetaRow label="Created"><span className="text-gray-600">{formatDateTime(ticket.createdAt)}</span></MetaRow>
              {ticket.updatedAt && (
                <MetaRow label="Updated"><span className="text-gray-600">{formatDateTime(ticket.updatedAt)}</span></MetaRow>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
            </div>

            {/* Actions */}
            {userInfo && (
              <ActionsPanel
                ticket={ticket}
                agents={agents}
                role={userInfo.role}
                userId={userInfo.id}
                actionLoading={actionLoading}
                successMsg={successMsg}
                actionError={actionError}
                onAssign={handleAssign}
                onChangeStatus={handleChangeStatus}
              />
            )}
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Comments
                {ticket.comments.length > 0 && (
                  <span className="ml-2 text-xs font-medium text-gray-400">({ticket.comments.length})</span>
                )}
              </h2>
              <CommentsPanel comments={ticket.comments} />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Audit Log
                {ticket.auditLogs.length > 0 && (
                  <span className="ml-2 text-xs font-medium text-gray-400">({ticket.auditLogs.length})</span>
                )}
              </h2>
              <AuditPanel logs={ticket.auditLogs} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
