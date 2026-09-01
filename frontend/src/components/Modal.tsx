'use client';

import { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { FIELD_DEFS, type FieldDef } from '@/lib/constants';

interface ModalProps {
  type: string;
  record: object | null;
  title: string;
  onSave: (rec: Record<string, unknown>) => void;
  onClose: () => void;
}

export default function Modal({ type, record, title, onSave, onClose }: ModalProps) {
  const { state, toast } = useApp();
  const [rec, setRec] = useState<Record<string, unknown>>({ ...((record as Record<string, unknown>) || {}) });
  const defs = FIELD_DEFS[type] || [];

  const set = (key: string, val: string) => setRec((r) => ({ ...r, [key]: val }));

  const save = () => {
    const cleaned: Record<string, unknown> = {};
    for (const f of defs) {
      const val = String(rec[f.key] ?? '').trim();
      if (f.required && !val) {
        toast('Please fill: ' + f.label, true);
        return;
      }
      cleaned[f.key] = val;
    }
    onSave({ ...rec, ...cleaned });
    onClose();
  };

  const selectOptions = (f: FieldDef): { value: string; label: string }[] => {
    const recId = (record as { id?: unknown } | null)?.id;
    if (f.type === 'select-dept') {
      return [{ value: '', label: '-- Select Department --' }, ...state.org.departments.map((d) => ({ value: d.id, label: d.name }))];
    }
    if (f.type === 'select-process') {
      return [{ value: '', label: '-- None --' }, ...state.org.processes.map((p) => ({ value: p.id, label: p.name }))];
    }
    if (f.type === 'select-group') {
      return [
        { value: '', label: '-- None (top-level group) --' },
        ...state.org.groups
          .filter((g) => !record || g.id !== recId)
          .map((g) => ({ value: g.id, label: g.name })),
      ];
    }
    if (f.type === 'select-entity') {
      return [
        { value: '', label: '-- None (top-level entity) --' },
        ...state.org.entities
          .filter((en) => !record || en.id !== recId)
          .map((en) => ({ value: en.id, label: en.legalName })),
      ];
    }
    if (f.type === 'select-entity-dept') {
      return [{ value: '', label: '-- Unassigned --' }, ...state.org.entities.map((en) => ({ value: en.id, label: en.legalName }))];
    }
    if (f.type === 'select-thirdparty') {
      return [{ value: '', label: '-- None --' }, ...state.thirdParties.list.map((t) => ({ value: t.id, label: t.vendor }))];
    }
    return [{ value: '', label: '--' }, ...(f.options || []).map((o) => ({ value: o, label: o }))];
  };

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}>
            &#10005;
          </button>
        </div>
        <div className="modal-body">
          {type === 'dataset' && <Datalist id="deptList" options={state.org.departments.map((d) => d.name)} />}
          {type === 'department' && <Datalist id="deptList" options={state.settings.departmentSeedOptions} />}
          {defs.map((f) => (
            <div key={f.key} className="form-row">
              <label>
                {f.label}
                {f.required && <span className="req"> *</span>}
              </label>
              {f.type === 'select' || f.type === 'select-dept' || f.type === 'select-process' || f.type === 'select-group' || f.type === 'select-entity' || f.type === 'select-entity-dept' || f.type === 'select-thirdparty' ? (
                <select id={`f_${f.key}`} value={String(rec[f.key] ?? f.def ?? '')} onChange={(e) => set(f.key, e.target.value)}>
                  {selectOptions(f).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea id={`f_${f.key}`} value={String(rec[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)} />
              ) : f.type === 'number' ? (
                <input
                  id={`f_${f.key}`}
                  type="number"
                  value={String(rec[f.key] ?? f.def ?? '')}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              ) : (
                <input
                  id={`f_${f.key}`}
                  type="text"
                  list={f.list}
                  value={String(rec[f.key] ?? f.def ?? '')}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Datalist({ id, options }: { id: string; options: string[] }) {
  return (
    <datalist id={id}>
      {options.map((o) => (
        <option key={o} value={o} />
      ))}
    </datalist>
  );
}
