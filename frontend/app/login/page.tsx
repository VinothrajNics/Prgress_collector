'use client';

import {
  FormEvent,
  useState,
} from 'react';

import {
  useRouter,
  useSearchParams,
} from 'next/navigation';

import {
  api,
  setToken,
} from '@/lib/api';

import {
  Building2,
  Lock,
  LogIn,
  ShieldCheck,
  User,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const initialRole =
    searchParams.get('role') ===
    'admin'
      ? 'admin'
      : 'client';

  const [role, setRole] =
    useState<
      'admin' | 'client'
    >(initialRole);

  const [username, setUsername] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const handleSubmit = async (
    e: FormEvent
  ) => {
    e.preventDefault();

    setError('');

    if (!username.trim()) {
      setError(
        'Username is required'
      );
      return;
    }

    if (!password) {
      setError(
        'Password is required'
      );
      return;
    }

    setLoading(true);

    try {
      const result =
        role === 'admin'
          ? await api.adminLogin(
              username,
              password
            )
          : await api.clientLogin(
              username,
              password
            );

      setToken(
        result.token
      );

      if (
        result.role ===
        'admin'
      ) {
        router.replace(
          '/admin'
        );
      } else {
        router.replace(
          '/client'
        );
      }
    } catch (e: any) {
      setError(
        e.message ??
          'Login failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-4 shadow-xl">
            <Building2
              size={28}
              className="text-white"
            />
          </div>

          <h1 className="text-3xl font-bold text-white">
            Process Tracker
          </h1>

          <p className="text-sm text-slate-400 mt-2">
            Secure process management portal
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-2 border-b border-slate-100">
            <button
              type="button"
              onClick={() =>
                setRole('client')
              }
              className={`py-4 text-sm font-semibold transition ${
                role === 'client'
                  ? 'text-brand-700 bg-brand-50 border-b-2 border-brand-600'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Client Login
            </button>

            <button
              type="button"
              onClick={() =>
                setRole('admin')
              }
              className={`py-4 text-sm font-semibold transition ${
                role === 'admin'
                  ? 'text-brand-700 bg-brand-50 border-b-2 border-brand-600'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Admin Login
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-7 space-y-5"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                {role ===
                'admin' ? (
                  <ShieldCheck
                    size={16}
                    className="text-brand-600"
                  />
                ) : (
                  <User
                    size={16}
                    className="text-brand-600"
                  />
                )}

                <label className="text-sm font-semibold text-slate-700">
                  Username
                </label>
              </div>

              <input
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
                autoComplete="username"
                placeholder={
                  role ===
                  'admin'
                    ? 'Admin username'
                    : 'Client username'
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Lock
                  size={16}
                  className="text-brand-600"
                />

                <label className="text-sm font-semibold text-slate-700">
                  Password
                </label>
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                autoComplete="current-password"
                placeholder="Enter password"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                <AlertCircle
                  size={17}
                  className="shrink-0 mt-0.5"
                />

                <span>
                  {error}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-brand-600/20"
            >
              {loading ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <LogIn
                  size={18}
                />
              )}

              {loading
                ? 'Signing in...'
                : `Sign in as ${
                    role ===
                    'admin'
                      ? 'Admin'
                      : 'Client'
                  }`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}