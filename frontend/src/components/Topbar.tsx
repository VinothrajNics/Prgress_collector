'use client';

import { useApp } from '@/store/AppContext';
import { useSession } from '@/store/SessionContext';
import { TAB_TITLES } from '@/lib/constants';
import { fmtDateTime } from '@/lib/utils';

export default function Topbar({
  tab,
  titleOverride,
  subtitleOverride,
}: {
  tab: string;
  titleOverride?: string;
  subtitleOverride?: string;
}) {
  const { state, savedAt, mutate, user, isAdmin, role, scopeClientId, setScopeClientId, clients, canEdit } = useApp();
  const { logout } = useSession();
  const [defTitle, defSub] = TAB_TITLES[tab] || TAB_TITLES.dashboard;
  const title = titleOverride || defTitle;
  const sub = subtitleOverride || defSub;
  const b = state.branding;

  const saveAll = () => {
    mutate('branding', (v) => v);
    mutate('org', (v) => v);
    mutate('inventory', (v) => v);
    mutate('thirdParties', (v) => v);
    mutate('signoffs', (v) => v);
    mutate('settings', (v) => v);
  };

  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        {isAdmin ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end', marginBottom: 6 }}>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Company filter:</span>
            <select
              className="company-switch"
              value={scopeClientId}
              onChange={(e) => setScopeClientId(e.target.value)}
              title="Scope every page to one company, or view all companies together"
            >
              <option value="">All companies</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Prepared for client use by</div>
        )}
        <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--navy)' }} id="consultantLine">
          {b.consultant}, {b.designation}
        </div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
          {!canEdit ? (
            <span className="hint" style={{ fontSize: '11px', color: 'var(--muted)' }}>
              Read-only overview — pick a company above to edit
            </span>
          ) : (
            <>
              <span className="timestamp-line" id="saveStatus">
                {savedAt ? 'All changes saved · ' + fmtDateTime(savedAt) : 'All changes saved'}
              </span>
              {role !== 'department' && (
                <button className="btn sm secondary" id="btnSaveAll" title="Force-save all data now" onClick={saveAll}>
                  &#128190; Save All
                </button>
              )}
            </>
          )}
          <button className="btn sm ghost" onClick={() => logout()} title="Sign out">
            Sign out · {user?.username}
          </button>
        </div>
      </div>
    </header>
  );
}
