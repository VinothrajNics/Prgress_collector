'use client';

import { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { uid } from '@/lib/utils';

export default function SettingsTab() {
  const { state, mutate, toast } = useApp();
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
    };
    mutate('branding', (v) => ({ ...v, ...next }));
    toast('Branding saved');
  };

  const loadSample = () => {
    if (state.org.groups.length > 0 && !window.confirm('This will add sample records alongside any existing data. Continue?')) return;
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
      vendor: 'CloudPay Payroll Services',
      type: 'Processor',
      service: 'Payroll Processing',
      country: 'India',
      dataReceived: 'Salary & bank details',
      dpaInPlace: 'No',
      contract: 'Yes',
      securityAssessment: 'No',
      risk: 'High',
    };
    mutate('org', (o) => ({
      ...o,
      groups: [...o.groups, g],
      entities: [...o.entities, e],
      departments: [...o.departments, dHR, dIT],
      processes: [...o.processes, pOnboard],
    }));
    mutate('thirdParties', (t) => ({ ...t, list: [...t.list, tp] }));
    mutate('inventory', (inv) => ({
      ...inv,
      datasets: [
        ...inv.datasets,
        {
          id: uid('ds'),
          name: 'Employee Master Data',
          departmentId: dHR.id,
          processId: pOnboard.id,
          personalData: 'Yes',
          dataPrincipalType: 'Employee',
          sensitivity: 'Sensitive',
          dataElements: 'Name, PAN, Aadhaar, Bank Details, Salary',
          purpose: 'Payroll & HR Administration',
          purposeDocumented: 'No',
          source: 'Direct - onboarding form',
          system: 'HRMS',
          storageLocation: 'HRMS Cloud Server',
          hostingCountry: 'India',
          sharedExternally: 'Yes',
          thirdPartyId: tp.id,
          crossBorder: 'No',
          destinationCountry: '',
          retentionPeriod: '',
          retentionUnit: 'Years',
          disposalMethod: '',
          owner: 'HR Head',
          notes: '',
        },
        {
          id: uid('ds'),
          name: 'Customer Order Data',
          departmentId: dIT.id,
          processId: '',
          personalData: 'Yes',
          dataPrincipalType: 'Customer',
          sensitivity: 'General',
          dataElements: 'Name, Phone, Address, Order History',
          purpose: 'Order Fulfilment',
          purposeDocumented: 'Yes',
          source: 'Direct - website',
          system: 'ERP',
          storageLocation: 'AWS Mumbai',
          hostingCountry: 'India',
          sharedExternally: 'Yes',
          thirdPartyId: '',
          crossBorder: 'Yes',
          destinationCountry: '',
          retentionPeriod: '3',
          retentionUnit: 'Years',
          disposalMethod: 'Automated purge',
          owner: '',
          notes: '',
        },
      ],
    }));
    toast('Sample data loaded');
  };

  const clearAll = () => {
    if (!window.confirm('This will permanently delete ALL data in this workspace. Continue?')) return;
    mutate('org', () => ({ groups: [], entities: [], departments: [], processes: [], activities: [] }));
    mutate('inventory', () => ({ datasets: [] }));
    mutate('thirdParties', () => ({ list: [] }));
    mutate('signoffs', () => ({ list: [] }));
    toast('Workspace cleared');
  };

  return (
    <section className="tab-panel active">
      <div className="card" style={{ maxWidth: 560 }}>
        <h3 style={{ marginTop: 0, color: 'var(--navy)' }}>Branding Configuration</h3>
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
        <button className="btn" onClick={saveBranding}>
          Save Branding
        </button>
      </div>

      <div className="card" style={{ maxWidth: 560, marginTop: 18 }}>
        <h3 style={{ marginTop: 0, color: 'var(--navy)' }}>Sample Data</h3>
        <p style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
          Load an illustrative organisation to explore the workspace, or clear everything to start the client&apos;s real
          discovery from a blank state.
        </p>
        <button className="btn secondary" onClick={loadSample}>
          Load Sample Data
        </button>
        <button className="btn danger" style={{ marginLeft: 8 }} onClick={clearAll}>
          Clear All Data
        </button>
      </div>
    </section>
  );
}
