'use client';

import { useApp } from '@/store/AppContext';
import { navFor, ROLE_LABELS } from '@/lib/constants';

export default function Sidebar({ tab, setTab }: { tab: string; setTab: (t: string) => void }) {
  const { state, user, role, isAdmin, scopeClientId } = useApp();
  const b = state.branding;
  const nav = navFor(role, isAdmin ? !!scopeClientId : true);
  return (
    <aside id="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <div className="brand-bg" style={{ background: `linear-gradient(135deg, ${b.teal}, ${b.royal})` }} />
          <span className="brand-letter">{b.companyName.charAt(0).toUpperCase()}</span>
          {b.logo ? (
            <img
              className="brand-logo"
              src={b.logo}
              alt=""
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : null}
        </div>
        <div>
          <div className="brand-name">{b.companyName}</div>
          <div className="brand-sub">{b.tagline}</div>
        </div>
      </div>
      <nav className="nav">
        {nav.map((n) => (
          <button key={n.tab} className={`nav-btn ${tab === n.tab ? 'active' : ''}`} onClick={() => setTab(n.tab)}>
            <span className="nav-ico">{n.icon}</span> {n.label}
          </button>
        ))}
      </nav>
      <div className="nav-footer">
        <div className="role-tag">{ROLE_LABELS[role] || role}</div>
        <div className="session-name">{user?.name || user?.username}</div>
        {user?.clientName ? <div className="session-client">{user.clientName}</div> : null}
        <div style={{ marginTop: 8 }}>
          DPDP Data Discovery Workspace
          <br />
          &copy; NICS
        </div>
      </div>
    </aside>
  );
}
