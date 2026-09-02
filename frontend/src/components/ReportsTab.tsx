'use client';

import { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { useUi } from './App';
import { fmtDate } from '@/lib/utils';
import { esc } from '@/lib/utils';
import type { Signoff } from '@/lib/types';
import ReportViewModal from './ReportViewModal';

export default function ReportsTab() {
  const { state, mutate, toast, canEdit, showCompany, clientNameOf } = useApp();
  const ui = useUi();
  const signoffs = state.signoffs.list;
  const [viewing, setViewing] = useState<Signoff | null>(null);

  const deleteSignoff = (id: string) => {
    mutate('signoffs', (s) => ({ ...s, list: s.list.filter((x) => x.id !== id) }));
    toast('Sign-off entry deleted');
  };

  return (
    <section className="tab-panel active">
      {canEdit ? (
        <div className="grid grid-3">
          <div className="card">
            <h3 style={{ marginTop: 0, color: 'var(--navy)', fontSize: '14.5px' }}>Executive Data Discovery Report</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
              Full organisation snapshot, data inventory register and risk findings, formatted for management &amp; board
              circulation.
            </p>
            <button className="btn" onClick={() => ui.openPrint('exec')}>
              Generate Report
            </button>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0, color: 'var(--navy)', fontSize: '14.5px' }}>Risk &amp; Gap Assessment</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
              High/Medium findings only &mdash; ideal for a rapid leadership briefing on exposure.
            </p>
            <button className="btn teal" onClick={() => ui.openPrint('risk')}>
              Generate Report
            </button>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0, color: 'var(--navy)', fontSize: '14.5px' }}>Data Inventory Register</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
              Complete processing/data register, RoPA-ready, one row per data set.
            </p>
            <button className="btn orange" onClick={() => ui.openPrint('register')}>
              Generate Report
            </button>
          </div>
        </div>
      ) : (
        <div className="banner">
          Report preview is available in read-only mode here (no sign-off capture). Select a company in the filter to
          generate reports with client acknowledgement.
        </div>
      )}

      <div className="section-title">Report History &amp; Sign-off Log</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {showCompany && <th>Company</th>}
              <th>Report</th>
              <th>Generated</th>
              <th>Status</th>
              <th>Client Acknowledged By</th>
              <th>Date</th>
              {canEdit && <th></th>}
            </tr>
          </thead>
          <tbody>
            {signoffs.length === 0 ? (
              <tr>
                <td colSpan={(showCompany ? 1 : 0) + 5 + (canEdit ? 1 : 0)}>
                  <div className="empty-state">No reports generated yet.</div>
                </td>
              </tr>
            ) : (
              signoffs.map((s) => (
                <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setViewing(s)} title="Click to view the generated report">
                  {showCompany && <td>{esc(clientNameOf((s as { clientId?: string }).clientId || ''))}</td>}
                  <td>
                    <span className="dept-name-link">&#128196; {esc(s.report)}</span>
                  </td>
                  <td>{fmtDate(s.generated)}</td>
                  <td>
                    <span className={`badge ${s.status === 'Acknowledged' ? 'ok' : 'neutral'}`}>{s.status}</span>
                  </td>
                  <td>
                    {esc(s.clientName) || '-'} {s.clientDesig ? ' (' + esc(s.clientDesig) + ')' : ''}
                  </td>
                  <td>{s.clientDate ? fmtDate(s.clientDate) : '-'}</td>
                  {canEdit && (
                    <td>
                      <button
                        className="icon-btn"
                        title="View report"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewing(s);
                        }}
                      >
                        &#128065;
                      </button>
                      <button
                        className="icon-btn"
                        title="Delete"
                        style={{ color: 'var(--danger)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSignoff(s.id);
                        }}
                      >
                        &#128465;
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewing && <ReportViewModal signoff={viewing} onClose={() => setViewing(null)} />}
    </section>
  );
}
