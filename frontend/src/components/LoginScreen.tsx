'use client';

import { useState } from 'react';
import { useSession } from '@/store/SessionContext';
import { DEMO_ACCOUNTS } from '@/lib/constants';

export default function LoginScreen() {
  const { login } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <div className="login-mark">N</div>
        <h1>NICS DPDP Data Discovery</h1>
        <p className="login-sub">Sign in to your workspace</p>
        <label className="form-row">
          <span>Username</span>
          <input autoFocus value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" autoComplete="username" />
        </label>
        <label className="form-row">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            autoComplete="current-password"
          />
        </label>
        {error && <div className="login-error">{error}</div>}
        <button className="btn login-btn" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign In'}
        </button>

        <div className="login-demo">
          <div className="login-demo-title">Demo logins for testing</div>
          {DEMO_ACCOUNTS.map((d) => (
            <button
              type="button"
              key={d.username}
              className="login-demo-row"
              onClick={() => {
                setUsername(d.username);
                setPassword(d.password);
              }}
            >
              <span className="login-demo-name">{d.label}</span>
              <code>
                {d.username} / {d.password}
              </code>
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
