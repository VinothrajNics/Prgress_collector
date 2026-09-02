'use client';

import { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { uid } from '@/lib/utils';

function LogoUploader({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const readFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result || ''));
    reader.readAsDataURL(file);
  };
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {value ? (
          <div
            style={{
              width: 72,
              height: 48,
              border: '1px solid var(--border)',
              borderRadius: 6,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
            }}
          >
            <img src={value} alt="logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        ) : (
          <div
            style={{
              width: 72,
              height: 48,
              border: '1px dashed var(--border)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              color: 'var(--muted)',
              background: 'var(--panel)',
            }}
          >
            No logo
          </div>
        )}
        <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={(e) => readFile(e.target.files?.[0])} />
        {value && (
          <button
            className="btn sm ghost"
            onClick={() => onChange('')}
            type="button"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

export default function SettingsTab() {
  const { state, mutate, toast, companyMode, scopeClientId } = useApp();
  const b = state.branding;
  const [form, setForm] = useState({
    companyName: b.companyName,
    tagline: b.tagline,
    consultant: b.consultant,
    designation: b.designation,
    phone: b.phone,
    navy: b.navy,
    royal: b.royal,
    teal: b.teal,
    orange: b.orange,
    logo: b.logo,
    partnerFirm: b.partnerFirm,
    partnerTagline: b.partnerTagline,
    partnerContact: b.partnerContact,
    partnerDesignation: b.partnerDesignation,
    partnerPhone: b.partnerPhone,
    partnerLogo: b.partnerLogo,
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const saveBranding = () => {
    const next = {
      companyName: form.companyName.trim() || 'NICS',
      tagline: form.tagline.trim(),
      consultant: form.consultant.trim(),
      designation: form.designation.trim(),
      phone: form.phone.trim(),
      navy: form.navy.trim() || '#1B2A5B',
      royal: form.royal.trim() || '#1F4E9C',
      teal: form.teal.trim() || '#0F7B7A',
      orange: form.orange.trim() || '#E8721E',
      logo: form.logo,
    };
    mutate('branding', (v) => ({ ...v, ...next }));
    toast('Branding configuration saved');
  };

  const savePartner = () => {
    const next = {
      partnerFirm: form.partnerFirm.trim(),
      partnerTagline: form.partnerTagline.trim(),
      partnerContact: form.partnerContact.trim(),
      partnerDesignation: form.partnerDesignation.trim(),
      partnerPhone: form.partnerPhone.trim(),
      partnerLogo: form.partnerLogo,
    };
    mutate('branding', (v) => ({ ...v, ...next }));
    toast('Partner details saved');
  };

  const loadSample = () => {
    if (state.org.groups.length > 0 && !window.confirm('This will add sample records alongside any existing data in the selected company. Continue?')) return;
    const g = { id: uid('grp'), name: 'Sample Holdings Group', hqCountry: 'India', dpo: 'Data Protection Officer', status: 'Active', parentGroupId: '', holdingPercent: '' };
    const e = {
      id: uid('ent'),
      groupId: g.id,
      legalName: 'Sample Manufacturing Pvt Ltd',
      tradingName: '',
      parentEntityId: '',
      holdingPercent: '',
      country: 'India',
      industry: 'Manufacturing',
      employeeCount: '350',
      status: 'Active',
    };
    const dHR = {
      id: uid('dep'),
      entityId: e.id,
      name: 'HR',
      headContact: 'HR Head',
      headDesignation: '',
      headEmail: '',
      headPhone: '',
      employeeCount: '8',
      location: '',
      criticality: 'High',
      status: 'Active',
      personalDataCollected: [],
      mediumOfCollection: [],
      retentionYears: '',
      retentionMonths: '',
      deviceUsed: '',
    };
    const dIT = { ...dHR, id: uid('dep'), name: 'IT', headContact: 'IT Manager', employeeCount: '12' };
    const pOnboard = {
      id: uid('proc'),
      departmentId: dHR.id,
      name: 'Employee Onboarding',
      category: 'HR Operations',
      owner: 'HR Head',
      ownerContact: '',
      reportingTo: '',
      frequency: 'Ad-hoc',
      manualAutomated: 'Hybrid',
      status: 'Active',
      personalInfoCollected: [],
      modeOfCollection: [],
      retentionYears: '',
      retentionMonths: '',
      softwareList: [],
      storageLocation: '',
      infoPassed: [],
    };
    const tp = {
      id: uid('tp'),
      code: 'VND-SAMPLE',
      vendor: 'Sample Payroll Processor',
      vendorStatus: 'Active',
      type: 'Data Processor',
      departmentCategory: 'Payroll',
      businessOwner: '',
      vendorContact: 'Available',
      contractOwner: 'Available',
      processingActivity: 'Payroll Processing',
      purpose: 'Payroll administration',
      personalDataCategories: ['Salary Information'],
      dataPrincipals: ['Employees'],
      volume: '',
      location: 'India',
      systems: '',
      subProcessors: 'Do not know',
      dpaInPlace: 'Available',
      risk: 'Medium',
    };
    mutate('org', (o) => ({
      ...o,
      groups: [...o.groups, g],
      entities: [...o.entities, e],
      departments: [...o.departments, dHR, dIT],
      processes: [...o.processes, pOnboard],
    }));
    mutate('thirdParties', (t) => ({ ...t, list: [...t.list, tp] }));
    toast('Sample data loaded');
  };

  const clearAll = () => {
    if (!window.confirm('This will permanently delete ALL data of the selected company. Continue?')) return;
    mutate('org', () => ({ groups: [], entities: [], departments: [], processes: [], activities: [] }));
    mutate('inventory', () => ({ datasets: [] }));
    mutate('thirdParties', () => ({ list: [] }));
    mutate('signoffs', () => ({ list: [] }));
    toast('Company workspace cleared');
  };

  return (
    <section className="tab-panel active">
      <div className="banner">
        Branding and partner details are platform configuration (used on reports for every company) and can only be
        changed by the admin.
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0, color: 'var(--navy)' }}>Branding Configuration</h3>
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 0 }}>
            Brand identity used across the application and on reports.
          </p>
          <div className="form-row">
            <label>Company / Application Name</label>
            <input type="text" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} />
          </div>
          <div className="form-row">
            <label>Tagline</label>
            <input type="text" value={form.tagline} onChange={(e) => set('tagline', e.target.value)} />
          </div>
          <div className="form-row">
            <label>Consultant / Prepared-by Name</label>
            <input type="text" value={form.consultant} onChange={(e) => set('consultant', e.target.value)} />
          </div>
          <div className="form-row">
            <label>Designation</label>
            <input type="text" value={form.designation} onChange={(e) => set('designation', e.target.value)} />
          </div>
          <div className="form-row">
            <label>Contact Number</label>
            <input type="text" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div className="section-title" style={{ margin: '16px 0 12px' }}>
            Theme Colours
          </div>
          <div className="form-grid">
            <div className="form-row">
              <label>Primary (Navy)</label>
              <input type="text" value={form.navy} onChange={(e) => set('navy', e.target.value)} />
            </div>
            <div className="form-row">
              <label>Secondary (Royal Blue)</label>
              <input type="text" value={form.royal} onChange={(e) => set('royal', e.target.value)} />
            </div>
            <div className="form-row">
              <label>Accent (Teal)</label>
              <input type="text" value={form.teal} onChange={(e) => set('teal', e.target.value)} />
            </div>
            <div className="form-row">
              <label>Highlight (Orange)</label>
              <input type="text" value={form.orange} onChange={(e) => set('orange', e.target.value)} />
            </div>
          </div>
          <LogoUploader label="Company Logo" value={form.logo} onChange={(v) => set('logo', v)} />
          <button className="btn" onClick={saveBranding}>
            Save Branding Configuration
          </button>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0, color: 'var(--navy)' }}>Partner Details</h3>
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 0 }}>
            Partner details printed on top of generated reports alongside the brand details.
          </p>
          <div className="form-row">
            <label>Partner Company Name</label>
            <input type="text" value={form.partnerFirm} onChange={(e) => set('partnerFirm', e.target.value)} />
          </div>
          <div className="form-row">
            <label>Tagline</label>
            <input type="text" value={form.partnerTagline} onChange={(e) => set('partnerTagline', e.target.value)} />
          </div>
          <div className="form-row">
            <label>Consultant / Prepared-by Name</label>
            <input type="text" value={form.partnerContact} onChange={(e) => set('partnerContact', e.target.value)} />
          </div>
          <div className="form-row">
            <label>Designation</label>
            <input type="text" value={form.partnerDesignation} onChange={(e) => set('partnerDesignation', e.target.value)} />
          </div>
          <div className="form-row">
            <label>Contact Number</label>
            <input type="text" value={form.partnerPhone} onChange={(e) => set('partnerPhone', e.target.value)} />
          </div>
          <LogoUploader label="Partner Logo" value={form.partnerLogo} onChange={(v) => set('partnerLogo', v)} />
          <button className="btn teal" onClick={savePartner}>
            Save Partner Details
          </button>
        </div>
      </div>

      {companyMode && (
        <div className="card" style={{ maxWidth: 560, marginTop: 18 }}>
          <h3 style={{ marginTop: 0, color: 'var(--navy)' }}>Selected Company Workspace Data</h3>
          <p style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
            {scopeClientId ? 'These actions apply to the company currently selected in the filter.' : ''}
          </p>
          <button className="btn secondary" onClick={loadSample}>
            Load Sample Data
          </button>
          <button className="btn danger" style={{ marginLeft: 8 }} onClick={clearAll}>
            Clear Selected Company Data
          </button>
        </div>
      )}
    </section>
  );
}
