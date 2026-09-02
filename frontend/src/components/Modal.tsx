'use client';

import { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { FIELD_DEFS, TP_DEPT_CATEGORIES, type FieldDef } from '@/lib/constants';

interface ModalProps {
  type: string;
  record: object | null;
  title: string;
  onSave: (rec: Record<string, unknown>) => void;
  onClose: () => void;
}

export default function Modal({ type, record, title, onSave, onClose }: ModalProps) {
  const { state, toast } = useApp();
  const [rec, setRec] = useState<Record<string, unknown>>(() => {
    const base = { ...((record as Record<string, unknown>) || {}) };
    for (const f of FIELD_DEFS[type] || []) {
      if (f.type === 'multichips' && !Array.isArray(base[f.key])) base[f.key] = [];
    }
    return base;
  });
  const [newChip, setNewChip] = useState<Record<string, string>>({});
  const defs = FIELD_DEFS[type] || [];

  const set = (key: string, val: string) => setRec((r) => ({ ...r, [key]: val }));

  const toggleChip = (key: string, opt: string) =>
    setRec((r) => {
      const cur = Array.isArray(r[key]) ? (r[key] as string[]) : [];
      return { ...r, [key]: cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt] };
    });

  const save = () => {
    const cleaned: Record<string, unknown> = {};
    for (const f of defs) {
      if (f.readOnly) continue;
      const val = rec[f.key];
      if (Array.isArray(val)) {
        cleaned[f.key] = [...val];
        continue;
      }
      const s = String(val ?? '').trim();
      if (f.required && !s) {
        toast('Please fill: ' + f.label, true);
        return;
      }
      cleaned[f.key] = s;
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

  const chipOptions = (f: FieldDef): string[] => {
    if (f.chipsMaster) {
      const master = (state.settings as unknown as Record<string, string[]>)[f.chipsMaster];
      return Array.isArray(master) ? master : [];
    }
    return f.options || [];
  };

  return (
    <div className="modal-overlay open">
      <div className="modal" style={{ maxWidth: type === 'thirdparty' ? 720 : undefined }}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}>
            &#10005;
          </button>
        </div>
        <div className="modal-body">
          {type === 'dataset' && <Datalist id="deptList" options={state.org.departments.map((d) => d.name)} />}
          {type === 'department' && <Datalist id="deptList" options={state.settings.departmentSeedOptions} />}
          {type === 'thirdparty' && <Datalist id="tpDeptCat" options={TP_DEPT_CATEGORIES} />}
          {type === 'thirdparty' && <Datalist id="tpSystems" options={state.settings.softwareOptions} />}
          {defs.map((f) => (
            <div key={f.key} className="form-row">
              <label>
                {f.label}
                {f.required && <span className="req"> *</span>}
              </label>
              {f.readOnly ? (
                <input type="text" value={String(rec[f.key] ?? '')} disabled placeholder="(auto-generated on save)" />
              ) : f.type === 'multichips' ? (
                <ChipGroup
                  f={f}
                  options={chipOptions(f)}
                  selected={Array.isArray(rec[f.key]) ? (rec[f.key] as string[]) : []}
                  onToggle={(opt) => toggleChip(f.key, opt)}
                  newVal={newChip[f.key] || ''}
                  onNewVal={(v) => setNewChip((n) => ({ ...n, [f.key]: v }))}
                />
              ) : f.type === 'select' || f.type === 'select-dept' || f.type === 'select-process' || f.type === 'select-group' || f.type === 'select-entity' || f.type === 'select-entity-dept' || f.type === 'select-thirdparty' ? (
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
              {f.hint && <div className="field-hint">{f.hint}</div>}
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

function ChipGroup({
  f,
  options,
  selected,
  onToggle,
  newVal,
  onNewVal,
}: {
  f: FieldDef;
  options: string[];
  selected: string[];
  onToggle: (opt: string) => void;
  newVal: string;
  onNewVal: (v: string) => void;
}) {
  const addCustom = () => {
    const v = newVal.trim();
    if (!v) return;
    onToggle(v);
    onNewVal('');
  };
  const union = [...options, ...selected.filter((o) => !options.includes(o))];
  return (
    <div>
      <div className="chip-list">
        {union.length === 0 ? <span className="field-hint">No options yet — add one below.</span> : null}
        {union.map((opt) => (
          <span key={opt} className={`chip ${selected.includes(opt) ? 'selected' : ''}`} onClick={() => onToggle(opt)}>
            {opt}
          </span>
        ))}
      </div>
      <div className="chip-add-row">
        <input
          type="text"
          placeholder={'Add another ' + f.label.toLowerCase() + '…'}
          value={newVal}
          onChange={(e) => onNewVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addCustom();
            }
          }}
        />
        <button className="btn sm secondary" onClick={addCustom}>
          + Add
        </button>
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
