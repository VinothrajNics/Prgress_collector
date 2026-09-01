'use client';

import { useState } from 'react';
import { useApp } from '@/store/AppContext';
import type { Department } from '@/lib/types';

export default function DataProfileModal({ dep, onClose }: { dep: Department; onClose: () => void }) {
  const { state, mutate, toast } = useApp();
  const [selectedData, setSelectedData] = useState<string[]>(Array.isArray(dep.personalDataCollected) ? [...dep.personalDataCollected] : []);
  const [selectedMedium, setSelectedMedium] = useState<string[]>(Array.isArray(dep.mediumOfCollection) ? [...dep.mediumOfCollection] : []);
  const [retentionYears, setRetentionYears] = useState(dep.retentionYears || '');
  const [retentionMonths, setRetentionMonths] = useState(dep.retentionMonths || '');
  const [deviceUsed, setDeviceUsed] = useState(dep.deviceUsed || '');
  const [newData, setNewData] = useState('');
  const [newMedium, setNewMedium] = useState('');

  const toggle = (kind: 'data' | 'medium', opt: string) => {
    if (kind === 'data') {
      setSelectedData((s) => (s.includes(opt) ? s.filter((o) => o !== opt) : [...s, opt]));
    } else {
      setSelectedMedium((s) => (s.includes(opt) ? s.filter((o) => o !== opt) : [...s, opt]));
    }
  };

  const removeMaster = (kind: 'data' | 'medium', opt: string) => {
    if (!window.confirm('Remove "' + opt + '" from the master options list? This will also unselect it here.')) return;
    if (kind === 'data') {
      mutate('settings', (s) => ({ ...s, personalDataOptions: s.personalDataOptions.filter((o) => o !== opt) }));
      setSelectedData((s) => s.filter((o) => o !== opt));
    } else {
      mutate('settings', (s) => ({ ...s, mediumOptions: s.mediumOptions.filter((o) => o !== opt) }));
      setSelectedMedium((s) => s.filter((o) => o !== opt));
    }
  };

  const addOption = (kind: 'data' | 'medium', val: string) => {
    const v = val.trim();
    if (!v) return;
    if (kind === 'data') {
      if (!state.settings.personalDataOptions.some((o) => o.toLowerCase() === v.toLowerCase())) {
        mutate('settings', (s) => ({ ...s, personalDataOptions: [...s.personalDataOptions, v] }));
      }
      setSelectedData((s) => [...s, v]);
      setNewData('');
    } else {
      if (!state.settings.mediumOptions.some((o) => o.toLowerCase() === v.toLowerCase())) {
        mutate('settings', (s) => ({ ...s, mediumOptions: [...s.mediumOptions, v] }));
      }
      setSelectedMedium((s) => [...s, v]);
      setNewMedium('');
    }
  };

  const save = () => {
    Object.assign(dep, {
      personalDataCollected: [...selectedData],
      mediumOfCollection: [...selectedMedium],
      retentionYears,
      retentionMonths,
      deviceUsed,
    });
    mutate('org', (o) => ({ ...o }));
    onClose();
    toast('Data collection profile saved');
  };

  return (
    <div className="modal-overlay open">
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h3>Personal Data Collection Profile &mdash; {dep.name}</h3>
          <button className="icon-btn" onClick={onClose}>
            &#10005;
          </button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <label>
              Personal Data Collected{' '}
              <span className="field-hint">(click to select/deselect; &times; removes from the master list)</span>
            </label>
            <div className="chip-list">
              {state.settings.personalDataOptions.length === 0 ? (
                <span className="field-hint">No options yet — add one below.</span>
              ) : (
                state.settings.personalDataOptions.map((opt) => (
                  <span key={opt} className={`chip ${selectedData.includes(opt) ? 'selected' : ''}`} onClick={() => toggle('data', opt)}>
                    <span className="chip-label">{opt}</span>
                    <span
                      className="chip-x"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMaster('data', opt);
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
                placeholder="Add a new personal data category..."
                value={newData}
                onChange={(e) => setNewData(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addOption('data', newData);
                }}
              />
              <button className="btn sm secondary" onClick={() => addOption('data', newData)}>
                + Add
              </button>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-row">
              <label>Retention Requirement — Years</label>
              <input type="number" min={0} value={retentionYears} onChange={(e) => setRetentionYears(e.target.value)} />
            </div>
            <div className="form-row">
              <label>Retention Requirement — Months</label>
              <input type="number" min={0} max={11} value={retentionMonths} onChange={(e) => setRetentionMonths(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <label>
              Medium of Information Collected{' '}
              <span className="field-hint">(click to select/deselect; &times; removes from the master list)</span>
            </label>
            <div className="chip-list">
              {state.settings.mediumOptions.length === 0 ? (
                <span className="field-hint">No options yet — add one below.</span>
              ) : (
                state.settings.mediumOptions.map((opt) => (
                  <span key={opt} className={`chip ${selectedMedium.includes(opt) ? 'selected' : ''}`} onClick={() => toggle('medium', opt)}>
                    <span className="chip-label">{opt}</span>
                    <span
                      className="chip-x"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMaster('medium', opt);
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
                placeholder="Add a new medium..."
                value={newMedium}
                onChange={(e) => setNewMedium(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addOption('medium', newMedium);
                }}
              />
              <button className="btn sm secondary" onClick={() => addOption('medium', newMedium)}>
                + Add
              </button>
            </div>
          </div>

          <div className="form-row">
            <label>Device Used to Collect Information</label>
            <select value={deviceUsed} onChange={(e) => setDeviceUsed(e.target.value)}>
              <option value="">--</option>
              <option value="Personal">Personal</option>
              <option value="Official">Official</option>
            </select>
          </div>
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
