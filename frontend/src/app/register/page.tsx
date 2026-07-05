'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api-client';

interface RegisterResponse {
  userId: string;
  email: string;
  fullName: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName:       '',
    lastName:        '',
    email:           '',
    password:        '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setFieldErrors(e => ({ ...e, [field]: '' }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      await apiClient.post<RegisterResponse>('/auth/register', {
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
        password:  form.password,
      });
      setSuccess(true);
      setTimeout(() => router.replace('/login'), 2500);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        const mapped: Record<string, string> = {};
        for (const [key, messages] of Object.entries(err.fieldErrors)) {
          const camel = key.charAt(0).toLowerCase() + key.slice(1);
          mapped[camel] = messages[0];
        }
        setFieldErrors(mapped);
      } else {
        setError(err instanceof Error ? err.message : 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Account created successfully</h2>
          <p className="text-sm text-gray-500 mt-1">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ITSM Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={e => update('firstName', e.target.value)}
                  placeholder="John"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                             placeholder:text-gray-400"
                />
                {fieldErrors.firstName && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={e => update('lastName', e.target.value)}
                  placeholder="Doe"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                             placeholder:text-gray-400"
                />
                {fieldErrors.lastName && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                           placeholder:text-gray-400"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => update('password', e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                           placeholder:text-gray-400"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={e => update('confirmPassword', e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                           placeholder:text-gray-400"
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 text-white text-sm font-semibold
                         hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
