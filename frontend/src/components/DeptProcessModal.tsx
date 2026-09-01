'use client';

import { useApp } from '@/store/AppContext';
import { useUi } from './App';
import { getSuggestedProcesses } from '@/lib/constants';
import { esc, retentionText, uid } from '@/lib/utils';
import type { Department, Process } from '@/lib/types';

export default function DeptProcessModal({ dep, onClose }: { dep: Department; onClose: () => void }) {
  const { state, mutate, toast } = useApp();
  const ui = useUi();

  const entityName = (id: string) => state.org.entities.find((e) => e.id === id)?.legalName || 'Unassigned';
  const processes = state.org.processes.filter((p) => p.departmentId === dep.id);
  const existingNames = processes.map((p) => p.name.toLowerCase());
  const suggestions = getSuggestedProcesses(dep.name).filter((s) => !existingNames.includes(s.toLowerCase()));

  const addSuggested = (name: string) => {
    const proc: Process = {
      id: uid('proc'),
      departmentId: dep.id,
      name,
      owner: '',
      personalInfoCollected: [],
      modeOfCollection: [],
      retentionYears: '',
      retentionMonths: '',
      softwareList: [],
      storageLocation: '',
      infoPassed: [],
      status: 'Active',
      category: '',
      ownerContact: '',
      reportingTo: '',
      frequency: '',
      manualAutomated: '',
    };
    mutate('org', (o) => ({ ...o, processes: [...o.processes, proc] }));
    toast('Process added: ' + name);
  };

  const deleteProcess = (p: Process) => {
    if (!window.confirm('Delete this process?')) return;
    mutate('org', (o) => ({
      ...o,
      processes: o.processes.filter((x) => x.id !== p.id),
      activities: o.activities.filter((a) => a.processId !== p.id),
    }));
  };

  return (
    <div className="modal-overlay open">
      <div className="modal" style={{ maxWidth: 960 }}>
        <div className="modal-header">
          <h3>Process Register &mdash; {dep.name}</h3>
          <button className="icon-btn" onClick={onClose}>
            &#10005;
          </button>
        </div>
        <div className="modal-body">
          <div className="field-hint" style={{ marginBottom: 12 }}>
            Head: {dep.headContact || '-'}
            {dep.headDesignation ? ' (' + dep.headDesignation + ')' : ''} · Contact: {dep.headEmail || dep.headPhone || '-'} ·
            Location: {dep.location || '-'} · Entity: {dep.entityId ? entityName(dep.entityId) : 'Unassigned'}
          </div>

          {suggestions.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div className="field-hint" style={{ marginBottom: 6 }}>
                Suggested processes for {dep.name} — click to add:
              </div>
              <div className="chip-list">
                {suggestions.map((s) => (
                  <span key={s} className="chip" onClick={() => addSuggested(s)}>
                    + {esc(s)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="toolbar" style={{ padding: '0 0 10px 0', border: 'none' }}>
            <button className="btn sm" onClick={() => ui.openProcessDetail(dep)}>
              + Add Process
            </button>
            <div className="spacer"></div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Process Name</th>
                  <th>Process Owner</th>
                  <th>Personal Info Collected</th>
                  <th>Mode of Collection</th>
                  <th>Retention</th>
                  <th>Software Used</th>
                  <th>Storage Location</th>
                  <th>Information Passed To</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {processes.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty-state">
                        No processes yet. Click a suggested process above or &quot;+ Add Process&quot;.
                      </div>
                    </td>
                  </tr>
                ) : (
                  processes.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <b>{esc(p.name)}</b>
                      </td>
                      <td>{esc(p.owner || '-')}</td>
                      <td>{esc((p.personalInfoCollected || []).join(', ') || '-')}</td>
                      <td>{esc((p.modeOfCollection || []).join(', ') || '-')}</td>
                      <td>{esc(retentionText(p.retentionYears, p.retentionMonths))}</td>
                      <td>{esc((p.softwareList || []).join(', ') || '-')}</td>
                      <td>{esc(p.storageLocation || '-')}</td>
                      <td>{esc((p.infoPassed || []).join(', ') || '-')}</td>
                      <td>
                        <button className="icon-btn" title="Edit" onClick={() => ui.openProcessDetail(dep, p)}>
                          &#9998;
                        </button>
                        <button className="icon-btn" title="Delete" style={{ color: 'var(--danger)' }} onClick={() => deleteProcess(p)}>
                          &#128465;
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
