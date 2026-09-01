'use client';

import { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { buildReportHTML, buildSignoffBlock } from '@/lib/reports';
import { todayISO, uid } from '@/lib/utils';

const TITLE_MAP: Record<string, string> = {
  exec: 'Executive Data Discovery Report',
  risk: 'DPDP Risk & Gap Assessment',
  register: 'Data Inventory Register',
  org: 'Organisation Structure Report',
};

export default function PrintModal({ type, onClose }: { type: string; onClose: () => void }) {
  const { state, mutate, toast } = useApp();
  const [signName, setSignName] = useState('');
  const [signDesig, setSignDesig] = useState('');
  const [signEmail, setSignEmail] = useState('');
  const [signDate, setSignDate] = useState(todayISO());
  const [preview, setPreview] = useState(() => buildReportHTML(type, state));

  const saveAndPrint = () => {
    const date = signDate || todayISO();
    const signHtml = buildSignoffBlock(state, { name: signName, desig: signDesig, email: signEmail, date });
    const fullHtml = buildReportHTML(type, state) + signHtml;
    setPreview(fullHtml);
    mutate('signoffs', (s) => ({
      ...s,
      list: [
        {
          id: uid('rpt'),
          report: TITLE_MAP[type] || type,
          generated: todayISO(),
          status: signName ? 'Acknowledged' : 'Draft',
          clientName: signName,
          clientDesig: signDesig,
          clientEmail: signEmail,
          clientDate: date,
        },
        ...s.list,
      ],
    }));
    toast('Sign-off saved. Opening print dialog...');
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="modal-overlay open" id="printModal">
      <div className="modal" style={{ maxWidth: 820 }}>
        <div className="modal-header no-print">
          <h3>Report Preview &amp; Client Sign-off</h3>
          <button className="icon-btn" onClick={onClose}>
            &#10005;
          </button>
        </div>
        <div className="modal-body">
          <div className="card no-print" style={{ marginBottom: 16, background: 'var(--panel)' }}>
            <h4 style={{ margin: '0 0 10px', color: 'var(--navy)', fontSize: 13 }}>
              Client Acknowledgement (captured into the PDF)
            </h4>
            <div className="form-grid">
              <div className="form-row">
                <label>Sponsor Name</label>
                <input type="text" placeholder="Optional at this stage" value={signName} onChange={(e) => setSignName(e.target.value)} />
              </div>
              <div className="form-row">
                <label>Designation</label>
                <input type="text" value={signDesig} onChange={(e) => setSignDesig(e.target.value)} />
              </div>
              <div className="form-row">
                <label>Email ID</label>
                <input type="text" placeholder="name@company.com" value={signEmail} onChange={(e) => setSignEmail(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <label>Acknowledgement Date</label>
              <input type="date" value={signDate} onChange={(e) => setSignDate(e.target.value)} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>
              Leave blank to print a blank sign-off block for a wet-ink signature after printing.
            </p>
          </div>
          <div id="printArea" dangerouslySetInnerHTML={{ __html: preview }} />
        </div>
        <div className="modal-footer no-print">
          <button className="btn ghost" onClick={onClose}>
            Close
          </button>
          <button className="btn" onClick={saveAndPrint}>
            Save Sign-off &amp; Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
