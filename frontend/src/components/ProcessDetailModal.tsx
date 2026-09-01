'use client';

import { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { uid } from '@/lib/utils';
import type { Department, Process } from '@/lib/types';

type Kind = 'data' | 'mode' | 'software' | 'passed';

const MASTER_KEYS: Record<Kind, 'personalDataOptions' | 'mediumOptions' | 'softwareOptions' | 'infoPassedOptions'> = {
  data: 'personalDataOptions',
  mode: 'mediumOptions',
  software: 'softwareOptions',
  passed: 'infoPassedOptions',
};

export default function ProcessDetailModal({
  dep,
  proc,
  onClose,
}: {
  dep: Department;
  proc?: Process;
  onClose: () => void;
}) {
  const { state, mutate, toast } = useApp();
  const isNew = !proc;
  const rec = proc || ({} as Process);

  const [name, setName] = useState(rec.name || '');
  const [owner, setOwner] = useState(rec.owner || '');
  const [sel, setSel] = useState<Record<Kind, string[]>>({
    data: Array.isArray(rec.personalInfoCollected) ? [...rec.personalInfoCollected] : [],
    mode: Array.isArray(rec.modeOfCollection) ? [...rec.modeOfCollection] : [],
    software: Array.isArray(rec.softwareList) ? [...rec.softwareList] : [],
    passed: Array.isArray(rec.infoPassed) ? [...rec.infoPassed] : [],
  });
  const [retentionYears, setRetentionYears] = useState(rec.retentionYears || '');
  const [retentionMonths, setRetentionMonths] = useState(rec.retentionMonths || '');
  const [storageLocation, setStorageLocation] = useState(rec.storageLocation || '');
  const [status, setStatus] = useState(rec.status || 'Active');
  const [newVal, setNewVal] = useState<Record<Kind, string>>({ data: '', mode: '', software: '', passed: '' });

  const masterList = (kind: Kind) => state.settings[MASTER_KEYS[kind]];

  const toggle = (kind: Kind, opt: string) => {
    setSel((s) => {
      const cur = s[kind];
      return { ...s, [kind]: cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt] };
    });
  };

  const removeMaster = (kind: Kind, opt: string) => {
    if (!window.confirm('Remove "' + opt + '" from the master options list? This will also unselect it here.')) return;
    mutate('settings', (s) => ({ ...s, [MASTER_KEYS[kind]]: masterList(kind).filter((o) => o !== opt) }));
    setSel((s) => ({ ...s, [kind]: s[kind].filter((o) => o !== opt) }));
  };

  const addOption = (kind: Kind, val: string) => {
    const v = val.trim();
    if (!v) return;
    if (!masterList(kind).some((o) => o.toLowerCase() === v.toLowerCase())) {
      mutate('settings', (s) => ({ ...s, [MASTER_KEYS[kind]]: [...masterList(kind), v] }));
    }
    setSel((s) => ({ ...s, [kind]: [...s[kind], v] }));
    setNewVal((n) => ({ ...n, [kind]: '' }));
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast('Please enter a process name', true);
      return;
    }
    const updated: Process = {
      ...rec,
      id: rec.id || uid('proc'),
      departmentId: dep.id,
      name: trimmed,
      owner: owner.trim(),
      personalInfoCollected: [...sel.data],
      modeOfCollection: [...sel.mode],
      retentionYears,
      retentionMonths,
      softwareList: [...sel.software],
      storageLocation: storageLocation.trim(),
      infoPassed: [...sel.passed],
      status,
    };
    mutate('org', (o) => ({
      ...o,
      processes: isNew ? [...o.processes, updated] : o.processes.map((p) => (p.id === updated.id ? updated : p)),
    }));
    onClose();
    toast('Process saved');
  };

  const chipRow = (kind: Kind, label: string, placeholder: string) => (
    <div className="form-row">
      <label>
        {label} <span className="field-hint">(click to select/deselect; &times; removes from the master list)</span>
      </label>
      <div className="chip-list">
        {masterList(kind).length === 0 ? (
          <span className="field-hint">No options yet — add one below.</span>
        ) : (
          masterList(kind).map((opt) => (
            <span key={opt} className={`chip ${sel[kind].includes(opt) ? 'selected' : ''}`} onClick={() => toggle(kind, opt)}>
              <span className="chip-label">{opt}</span>
              <span
                className="chip-x"
                onClick={(e) => {
                  e.stopPropagation();
                  removeMaster(kind, opt);
                }}
              >
                &times;
              </span>
            </span>
          ))
        )}
      </div>
      <div className="chip-add-row">
        <input
          type="text"
          placeholder={placeholder}
          value={newVal[kind]}
          onChange={(e) => setNewVal((n) => ({ ...n, [kind]: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addOption(kind, newVal[kind]);
          }}
        />
        <button className="btn sm secondary" onClick={() => addOption(kind, newVal[kind])}>
          + Add
        </button>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay open">
      <div className="modal" style={{ maxWidth: 660 }}>
        <div className="modal-header">
          <h3>{isNew ? 'Add Process — ' + dep.name : 'Edit Process — ' + rec.name}</h3>
          <button className="icon-btn" onClick={onClose}>
            &#10005;
          </button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-row">
              <label>1. Process Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-row">
              <label>2. Process Owner</label>
              <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} />
            </div>
          </div>

          {chipRow('data', '3. Personal Information Collected', 'Add a new personal data category...')}

          {chipRow('mode', '4. Mode of Collection (e.g. Email, Messaging Application, Other)', 'Add a new mode of collection...')}

          <div className="form-row">
            <label>5. Retention Period — how long it is retained</label>
            <div className="form-grid">
              <div>
                <input type="number" min={0} placeholder="Years" value={retentionYears} onChange={(e) => setRetentionYears(e.target.value)} />
              </div>
              <div>
                <input type="number" min={0} max={11} placeholder="Months" value={retentionMonths} onChange={(e) => setRetentionMonths(e.target.value)} />
              </div>
            </div>
          </div>

          {chipRow('software', '6. Software / Systems Used (e.g. ERP, Cloud)', 'Add a new software / system...')}

          <div className="form-row">
            <label>7. Storage Location</label>
            <input
              type="text"
              placeholder="e.g. On-premise server, AWS Mumbai, local drive..."
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
            />
          </div>

          {chipRow('passed', '8. Information Passed To', 'Add a new recipient...')}

          <div className="form-row">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" onClick={save}>
            Save Process
          </button>
        </div>
      </div>
    </div>
  );
}
