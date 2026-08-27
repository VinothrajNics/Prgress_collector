"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import {
  Lock,
  Loader2,
  LogIn,
  ShieldCheck,
  Users,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError("");

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);

    try {
      const result = await api.login(
        username.trim(),
        password
      );

      const role =
        result.user?.role ||
        result.role;

      if (role === "admin") {
        window.location.href = "/admin";
      } else if (role === "client") {
        window.location.href = "/client";
      } else {
        throw new Error(
          "Unable to determine your account type."
        );
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Invalid username or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-white/10 border border-white/10 backdrop-blur flex items-center justify-center">
            <ShieldCheck
              size={32}
              className="text-indigo-300"
            />
          </div>

          <h1 className="text-3xl font-bold text-white">
            Collect
          </h1>

          <p className="text-slate-400 mt-2">
            Process management portal
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          <div className="px-7 pt-7 pb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Welcome back
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Sign in to continue to your portal.
            </p>
          </div>

          {error && (
            <div className="mx-7 mb-4 flex gap-3 items-start rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertCircle
                size={18}
                className="shrink-0 mt-0.5"
              />

              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="px-7 pb-7 space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Username
              </label>

              <div className="relative">
                <Users
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  autoComplete="username"
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="current-password"
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition"
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign in
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Lock size={13} />
          Secure authenticated access
        </div>
      </div>
    </main>
  );
}