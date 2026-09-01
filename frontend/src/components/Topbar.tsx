'use client';

import { useApp } from '@/store/AppContext';
import { TAB_TITLES } from '@/lib/constants';
import { fmtDateTime } from '@/lib/utils';

export default function Topbar({ tab }: { tab: string }) {
  const { state, savedAt, mutate } = useApp();
  const [title, sub] = TAB_TITLES[tab] || TAB_TITLES.dashboard;
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
        <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Prepared for client use by</div>
        <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--navy)' }} id="consultantLine">
          {b.consultant}, {b.designation}
        </div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
          <span className="timestamp-line" id="saveStatus">
            {savedAt ? 'All changes saved · ' + fmtDateTime(savedAt) : 'All changes saved'}
          </span>
          <button className="btn sm secondary" id="btnSaveAll" title="Force-save all data now" onClick={saveAll}>
            &#128190; Save All
          </button>
        </div>
      </div>
    </header>
  );
}
