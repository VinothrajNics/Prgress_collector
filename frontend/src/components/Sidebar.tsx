'use client';

import { useApp } from '@/store/AppContext';

const NAV = [
  { tab: 'dashboard', icon: '\u25A0', label: 'Dashboard' },
  { tab: 'org', icon: '\u229E', label: 'Organisation Structure' },
  { tab: 'department', icon: '\u2637', label: 'Department' },
  { tab: 'inventory', icon: '\u2630', label: 'Data Inventory' },
  { tab: 'thirdparty', icon: '\u21C4', label: 'Third Parties' },
  { tab: 'reports', icon: '\u2709', label: 'Reports & Sign-off' },
  { tab: 'settings', icon: '\u2699', label: 'Branding & Settings' },
];

export default function Sidebar({ tab, setTab }: { tab: string; setTab: (t: string) => void }) {
  const { state } = useApp();
  const b = state.branding;
  return (
    <aside id="sidebar">
      <div className="brand">
        <div
          className="brand-mark"
          style={{ background: `linear-gradient(135deg, ${b.teal}, ${b.royal})` }}
        >
          {b.companyName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="brand-name">{b.companyName}</div>
          <div className="brand-sub">{b.tagline}</div>
        </div>
      </div>
      <nav className="nav">
        {NAV.map((n) => (
          <button
            key={n.tab}
            className={`nav-btn ${tab === n.tab ? 'active' : ''}`}
            onClick={() => setTab(n.tab)}
          >
            <span className="nav-ico">{n.icon}</span> {n.label}
          </button>
        ))}
      </nav>
      <div className="nav-footer">
        DPDP Data Discovery Workspace
        <br />
        &copy; NICS &mdash; Client Workspace
      </div>
    </aside>
  );
}
