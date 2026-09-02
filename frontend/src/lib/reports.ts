import type { AppState, Dataset, ThirdParty } from './types';
import { esc, fmtDate, fmtDateTime } from './utils';

export interface Finding {
  sev: string;
  text: string;
  ds: Dataset;
}

export function evaluateRisks(ds: Dataset, thirdParties: ThirdParty[]): Finding[] {
  const findings: Finding[] = [];
  if (ds.personalData === 'Yes' && !ds.retentionPeriod) findings.push({ sev: 'High', text: 'Retention period not defined', ds });
  if (ds.personalData === 'Yes' && ds.purposeDocumented === 'No') findings.push({ sev: 'High', text: 'Purpose of processing not documented', ds });
  if (ds.sharedExternally === 'Yes' && !ds.thirdPartyId) findings.push({ sev: 'High', text: 'Recipient of shared data not identified', ds });
  if (ds.thirdPartyId) {
    const tp = thirdParties.find((t) => t.id === ds.thirdPartyId);
    if (tp && tp.dpaInPlace !== 'Available') findings.push({ sev: 'High', text: 'Data Processing Agreement (DPA) unavailable with ' + tp.vendor, ds });
  }
  if (ds.crossBorder === 'Yes' && !ds.destinationCountry) findings.push({ sev: 'High', text: 'Cross-border transfer destination unknown', ds });
  if (ds.personalData === 'Yes' && !ds.storageLocation) findings.push({ sev: 'High', text: 'Storage location not identified', ds });
  if (!ds.owner) findings.push({ sev: 'Medium', text: 'Data / process ownership not established', ds });
  if (ds.personalData === 'Yes' && !ds.disposalMethod) findings.push({ sev: 'Medium', text: 'Disposal mechanism not established', ds });
  return findings;
}

export function highestSeverity(findings: Finding[]): string {
  if (findings.some((f) => f.sev === 'High')) return 'High';
  if (findings.some((f) => f.sev === 'Medium')) return 'Medium';
  return 'Clean';
}

function partnerBrandRight(b: AppState['branding']): string {
  if (!(b.partnerFirm || b.partnerLogo)) return '';
  return `<div class="rpt-brand right">
    ${b.partnerLogo ? `<img class="rpt-logo" src="${b.partnerLogo}" alt="partner logo" />` : `<div class="rpt-mark">${esc((b.partnerFirm || 'P').charAt(0))}</div>`}
    <div><h2>${esc(b.partnerFirm)}</h2><div class="tag">${esc(b.partnerTagline)}</div></div>
  </div>`;
}

function groupName(state: AppState, id: string): string {
  const g = state.org.groups.find((x) => x.id === id);
  return g ? g.name : '';
}

function entityName(state: AppState, id: string): string {
  const e = state.org.entities.find((x) => x.id === id);
  return e ? e.legalName : '';
}

function deptName(state: AppState, id: string): string {
  const d = state.org.departments.find((x) => x.id === id);
  return d ? d.name : '-';
}

function tpName(state: AppState, id: string): string {
  const t = state.thirdParties.list.find((x) => x.id === id);
  return t ? t.vendor : '-';
}

export function buildReportHTML(type: string, state: AppState): string {
  const b = state.branding;
  const org = state.org;
  const inv = state.inventory.datasets;
  const tps = state.thirdParties.list;
  const findings: Finding[] = [];
  inv.forEach((ds) => evaluateRisks(ds, tps).forEach((f) => findings.push(f)));
  const high = findings.filter((f) => f.sev === 'High').length;
  const med = findings.filter((f) => f.sev === 'Medium').length;

  const titleMap: Record<string, string> = {
    exec: 'Executive Data Discovery Report',
    risk: 'DPDP Risk & Gap Assessment',
    register: 'Data Inventory Register',
    org: 'Organisation Structure Report',
  };

  let html = `<div class="rpt-page">
    <div class="rpt-letterhead">
      <div class="rpt-brand">
        ${b.logo ? `<img class="rpt-logo" src="${b.logo}" alt="logo" />` : `<div class="rpt-mark">${esc(b.companyName.charAt(0))}</div>`}
        <div><h2>${esc(b.companyName)}</h2><div class="tag">${esc(b.tagline)}</div></div>
      </div>
      ${partnerBrandRight(b)}
    </div>
    <div class="rpt-title">${titleMap[type] || ''}</div>
    <div class="rpt-sub">Confidential &mdash; prepared for internal management review under the Digital Personal Data Protection Act, 2023.</div>

    <div class="rpt-section">
      <h4>1. Organisation Snapshot</h4>
      <table><tbody>
        <tr><td>Groups</td><td><b>${org.groups.length}</b></td><td>Legal Entities</td><td><b>${org.entities.length}</b></td></tr>
        <tr><td>Departments</td><td><b>${org.departments.length}</b></td><td>Processes</td><td><b>${org.processes.length}</b></td></tr>
        <tr><td>Data Inventory Records</td><td><b>${inv.length}</b></td><td>Third Parties</td><td><b>${tps.length}</b></td></tr>
        <tr><td>High Risk Findings</td><td><b style="color:var(--high)">${high}</b></td><td>Medium Risk Findings</td><td><b style="color:var(--medium)">${med}</b></td></tr>
      </tbody></table>
    </div>`;

  if (type === 'org') {
    html += `<div class="rpt-section"><h4>2. Group / Legal Entity Structure</h4>
      <table><thead><tr><th>Level</th><th>Name</th><th>Parent</th><th>% Holding</th><th>Country</th></tr></thead><tbody>
      ${org.groups.map((g) => `<tr><td>Group</td><td>${esc(g.name)}</td><td>${esc(g.parentGroupId ? groupName(state, g.parentGroupId) : '-')}</td><td>${esc(g.holdingPercent || '-')}</td><td>${esc(g.hqCountry || '-')}</td></tr>`).join('')}
      ${org.entities.map((en) => `<tr><td>Legal Entity</td><td>${esc(en.legalName)}</td><td>${esc(en.parentEntityId ? entityName(state, en.parentEntityId) : groupName(state, en.groupId))}</td><td>${esc(en.holdingPercent || '-')}</td><td>${esc(en.country || '-')}</td></tr>`).join('')}
      ${org.groups.length + org.entities.length === 0 ? '<tr><td colspan="5">No records.</td></tr>' : ''}
      </tbody></table></div>`;

    html += `<div class="rpt-section"><h4>3. Department Profiles</h4>
      <table><thead><tr><th>Department</th><th>Entity</th><th>Head</th><th>Designation</th><th>Contact</th><th>Employees</th><th>Location</th><th>Personal Data Collected</th><th>Retention</th><th>Medium</th><th>Device</th></tr></thead><tbody>
      ${org.departments.map((d) => {
        const ent = org.entities.find((e) => e.id === d.entityId);
        const retention = d.retentionYears || d.retentionMonths ? [d.retentionYears ? d.retentionYears + 'y' : '', d.retentionMonths ? d.retentionMonths + 'm' : ''].filter(Boolean).join(' ') : 'Not set';
        return `<tr><td>${esc(d.name)}</td><td>${esc(ent ? ent.legalName : 'Unassigned')}</td><td>${esc(d.headContact || '-')}</td><td>${esc(d.headDesignation || '-')}</td><td>${esc(d.headEmail || d.headPhone || '-')}</td><td>${esc(d.employeeCount || '-')}</td><td>${esc(d.location || '-')}</td><td>${esc((d.personalDataCollected || []).join(', ') || '-')}</td><td>${esc(retention)}</td><td>${esc((d.mediumOfCollection || []).join(', ') || '-')}</td><td>${esc(d.deviceUsed || '-')}</td></tr>`;
      }).join('') || '<tr><td colspan="11">No departments recorded.</td></tr>'}
      </tbody></table></div>`;

    html += `</div>`;
    return html;
  }

  if (type !== 'risk') {
    html += `<div class="rpt-section"><h4>2. Data Inventory Register</h4>
      <table><thead><tr><th>Data Set</th><th>Department</th><th>Principal</th><th>Sensitivity</th><th>Purpose Documented</th><th>Retention</th><th>Cross-Border</th></tr></thead><tbody>
      ${inv.map((ds) => `<tr><td>${esc(ds.name)}</td><td>${esc(deptName(state, ds.departmentId))}</td><td>${esc(ds.dataPrincipalType || '-')}</td><td>${esc(ds.sensitivity || '-')}</td><td>${esc(ds.purposeDocumented || '-')}</td><td>${ds.retentionPeriod ? ds.retentionPeriod + ' ' + (ds.retentionUnit || '') : 'Not set'}</td><td>${esc(ds.crossBorder || '-')}</td></tr>`).join('') || '<tr><td colspan="7">No records.</td></tr>'}
      </tbody></table></div>`;
  }

  html += `<div class="rpt-section"><h4>${type === 'risk' ? '2' : '3'}. Risk & Gap Findings</h4>
    <table><thead><tr><th>Severity</th><th>Finding</th><th>Data Set</th><th>Department</th></tr></thead><tbody>
    ${findings.length ? findings.map((f) => `<tr><td>${f.sev}</td><td>${esc(f.text)}</td><td>${esc(f.ds.name)}</td><td>${esc(deptName(state, f.ds.departmentId))}</td></tr>`).join('') : '<tr><td colspan="4">No findings identified at time of report generation.</td></tr>'}
    </tbody></table></div>`;

  if (type !== 'register') {
    html += `<div class="rpt-section"><h4>${type === 'risk' ? '3' : '4'}. Recommended Next Steps</h4>
    <p style="font-size:12.5px;">Based on the findings above, NICS recommends a structured DPDP compliance programme comprising a formal Gap Assessment, Data Mapping exercise, Privacy Policy development, Vendor/Third-Party Risk Assessment, Mock Audit and Internal Auditor Training. Please contact ${esc(b.consultant)} to scope the next phase.</p></div>`;
  }

  html += `</div>`;
  return html;
}

export function buildSignoffBlock(
  state: AppState,
  info: { name: string; desig: string; email: string; date: string }
): string {
  const b = state.branding;
  const brandRows: [string, string][] = [
    ['Name:', b.consultant || ''],
    ['Designation:', b.designation || ''],
    ['Contact:', b.phone || ''],
  ].filter((r) => r[1]) as [string, string][];
  return `
    <div class="rpt-signoff">
      <h4 style="border:none;color:var(--navy);font-size:13.5px;text-transform:uppercase;letter-spacing:0.4px;">Sign-off</h4>
      <div class="sign-grid">
        <div class="sign-box">
          <h5>Prepared By (${esc(b.companyName)})</h5>
          ${b.logo ? `<div style="margin-bottom:8px;"><img class="rpt-logo sign-logo" src="${b.logo}" alt="logo" /></div>` : ''}
          <div class="sign-fields">
            ${brandRows.map(([k, v]) => `<div><b>${k}</b> ${esc(v)}</div>`).join('')}
            <div><b>Date:</b> ${fmtDate(new Date().toISOString().slice(0, 10))}</div>
          </div>
          <div class="sign-line"></div>
          <div style="font-size:10.5px;color:var(--muted);text-align:center;">Signature</div>
        </div>
        <div class="sign-box">
          <h5>Sponsor Sign-off</h5>
          <div class="sign-fields">
            <div><b>Name:</b> ${esc(info.name) || '________________________'}</div>
            <div><b>Designation:</b> ${esc(info.desig) || '________________________'}</div>
            <div><b>Email ID:</b> ${esc(info.email) || '________________________'}</div>
            <div><b>Date:</b> ${fmtDate(info.date)}</div>
          </div>
          <div class="sign-line"></div>
          <div style="font-size:10.5px;color:var(--muted);text-align:center;">Sponsor Signature</div>
        </div>
      </div>
      <p style="font-size:10.5px;color:var(--muted);margin-top:14px;">This report reflects information available in the NICS DPDP Data Discovery workspace as of ${esc(fmtDateTime(new Date()))} and is intended to support the client's internal DPDP compliance journey.</p>
    </div>`;
}
