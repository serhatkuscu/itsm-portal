'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api-client';
import { auth } from '@/lib/auth';
import type { CreateTicketResponse } from '@/types';

// ── Priority options (enum values match backend: Low=1…Critical=4) ─────────

const PRIORITY_OPTIONS = [
  { label: 'Low',      value: 1 },
  { label: 'Medium',   value: 2 },
  { label: 'High',     value: 3 },
  { label: 'Critical', value: 4 },
] as const;

// ── Field-level error helper ──────────────────────────────────────────────────

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <ul className="mt-1.5 space-y-0.5">
      {messages.map((m, i) => (
        <li key={i} className="text-xs text-red-600 flex items-start gap-1">
          <svg className="w-3 h-3 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {m}
        </li>
      ))}
    </ul>
  );
}

// ── Input styles ──────────────────────────────────────────────────────────────

function inputClass(hasError: boolean) {
  return [
    'w-full px-3.5 py-2.5 rounded-lg border text-sm',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
    'placeholder:text-gray-400',
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
  ].join(' ');
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function NewTicketPage() {
  const router = useRouter();

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [priority,    setPriority]    = useState<number>(2); // default Medium

  const [loading,     setLoading]     = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!auth.isAuthenticated()) router.replace('/login');
  }, [router]);

  function clearErrors() {
    setGlobalError('');
    setFieldErrors({});
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearErrors();
    setLoading(true);

    try {
      const data = await apiClient.post<CreateTicketResponse>('/tickets', {
        title:       title.trim(),
        description: description.trim(),
        priority,
      });
      router.push(`/tickets/${data.ticketId}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
          setFieldErrors(err.fieldErrors);
        } else {
          setGlobalError(err.message);
        }
      } else {
        setGlobalError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

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
            <span className="text-gray-500">New</span>
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

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/tickets"
            className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
            title="Back to tickets"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">New Ticket</h1>
            <p className="text-sm text-gray-500 mt-0.5">Submit a new support request</p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          {/* Global error banner */}
          {globalError && (
            <div className="mb-6 flex items-start gap-2.5 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={300}
                placeholder="Brief summary of the issue"
                className={inputClass(!!fieldErrors['Title']?.length)}
                disabled={loading}
              />
              <FieldError messages={fieldErrors['Title']} />
              <p className="mt-1 text-xs text-gray-400 text-right">{title.length}/300</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={5000}
                rows={6}
                placeholder="Describe the issue in detail — steps to reproduce, expected vs actual behaviour, affected systems…"
                className={`${inputClass(!!fieldErrors['Description']?.length)} resize-y min-h-[120px]`}
                disabled={loading}
              />
              <FieldError messages={fieldErrors['Description']} />
              <p className="mt-1 text-xs text-gray-400 text-right">{description.length}/5000</p>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                value={priority}
                onChange={e => setPriority(Number(e.target.value))}
                className={`${inputClass(!!fieldErrors['Priority']?.length)} cursor-pointer`}
                disabled={loading}
              >
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <FieldError messages={fieldErrors['Priority']} />

              {/* Priority hint */}
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { label: 'Low',      hint: '72h SLA', color: 'text-slate-500' },
                  { label: 'Medium',   hint: '24h SLA', color: 'text-blue-600' },
                  { label: 'High',     hint: '8h SLA',  color: 'text-orange-600' },
                  { label: 'Critical', hint: '2h SLA',  color: 'text-red-600' },
                ].map(p => (
                  <div
                    key={p.label}
                    className={`flex items-center gap-1 ${p.color} ${priority === PRIORITY_OPTIONS.findIndex(o => o.label === p.label) + 1 ? 'font-semibold' : ''}`}
                  >
                    <span className="font-medium">{p.label}:</span>
                    <span>{p.hint}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <Link
                href="/tickets"
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Ticket
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
