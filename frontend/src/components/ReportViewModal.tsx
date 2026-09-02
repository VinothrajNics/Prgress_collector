'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useApp } from '@/store/AppContext';
import { buildReportHTML, buildSignoffBlock } from '@/lib/reports';
import type { Signoff } from '@/lib/types';

const TYPE_FROM_TITLE: Record<string, string> = {
  'Executive Data Discovery Report': 'exec',
  'DPDP Risk & Gap Assessment': 'risk',
  'Data Inventory Register': 'register',
  'Organisation Structure Report': 'org',
};

export default function ReportViewModal({ signoff, onClose }: { signoff: Signoff; onClose: () => void }) {
  const { state } = useApp();
  const autoPrinted = useRef(false);

  const html = useMemo(() => {
    if (signoff.content) return signoff.content;
    const type = signoff.reportType || TYPE_FROM_TITLE[signoff.report] || '';
    if (!type) return '';
    const reportHtml = buildReportHTML(type, state);
    const signBlock = buildSignoffBlock(state, {
      name: signoff.clientName || '',
      desig: signoff.clientDesig || '',
      email: signoff.clientEmail || '',
      date: signoff.clientDate || '',
    });
    return reportHtml + signBlock;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signoff.id, signoff.content, signoff.reportType, state]);

  // Show the report document (print/PDF preview) immediately when opened.
  useEffect(() => {
    if (!html || autoPrinted.current) return;
    autoPrinted.current = true;
    const t = setTimeout(() => window.print(), 350);
    return () => clearTimeout(t);
  }, [html]);

  return (
    <div className="modal-overlay open" id="reportViewModal">
      <div className="modal" style={{ maxWidth: 900 }}>
        <div className="modal-header no-print">
          <h3>{signoff.report} — Generated {signoff.generated}</h3>
          <button className="icon-btn" onClick={onClose}>
            &#10005;
          </button>
        </div>
        <div className="modal-body">
          {html ? (
            <div id="printArea" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <div className="empty-state">
              No preview is available for this older report entry.
              <br />
              <span className="hint">Regenerate the report to store a re-viewable copy.</span>
            </div>
          )}
        </div>
        <div className="modal-footer no-print">
          <button className="btn ghost" onClick={onClose}>
            Close
          </button>
          {html && (
            <button className="btn" onClick={() => window.print()}>
              &#128438; Print / Save as PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
