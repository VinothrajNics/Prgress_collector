import type { AppState, Role } from './types';

export const DEFAULT_DEPARTMENT_SEED = [
  'Administration',
  'Human Resources',
  'Accounts & Finance',
  'Legal',
  'Company Secretaryship',
  'Procurement',
];

export const DEFAULT_PERSONAL_DATA_OPTIONS = [
  'Name',
  'Contact Details (Email/Phone)',
  'Address',
  'Government ID (PAN/Aadhaar/Passport)',
  'Financial / Bank Details',
  'Salary Information',
  'Health / Medical Data',
  'Biometric Data',
  'Employment Records',
  'Location Data',
  'Photograph / Video',
  'Educational Qualification',
  'Family Details',
];

export const DEFAULT_MEDIUM_OPTIONS = [
  'Email',
  'Messaging Application',
  'Hard Copy / Physical Form',
  'Website / Online Form',
  'Phone Call',
  'In-Person Collection',
];

export const DEFAULT_SOFTWARE_OPTIONS = [
  'ERP',
  'Cloud Storage',
  'CRM',
  'HRMS',
  'Payroll Software',
  'Email Server',
  'Document Management System',
];

export const DEFAULT_INFO_PASSED_OPTIONS = [
  'Not Shared Externally',
  'Group / Affiliate Company',
  'Third-Party Vendor',
  'Regulatory Authority',
  'Auditor',
  'Bank / Financial Institution',
  'Government Department',
];

export const VENDOR_TYPE_OPTIONS = ['Joint Fiduciary', 'Data Processor', 'Sub-processor', 'Service Provider', 'Do not know'];
export const VENDOR_STATUS_OPTIONS = ['Active', 'Non Active'];
export const AVAILABILITY_OPTIONS = ['Available', 'Not Available'];
export const YES_NO_DONT_KNOW = ['Yes', 'No', 'Do not know'];
export const RISK_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
export const TP_LOCATION_OPTIONS = ['India', 'Overseas'];
export const TP_DEPT_CATEGORIES = ['HR', 'Payroll', 'IT', 'Cloud', 'Marketing', 'CRM', 'Finance', 'Sales', 'Operations', 'Legal', 'Procurement', 'Customer Service', 'Company Secretaryship'];
export const DATA_PRINCIPAL_OPTIONS = ['Employees', 'Customers', 'Vendors', 'Children', 'Job Applicants', 'Business Contacts', 'Other'];

export const PROCESS_SEED_BY_DEPT: Record<string, string[]> = {
  administration: ['Facility Management', 'Visitor Management', 'Asset Management', 'Travel & Logistics Coordination'],
  'human resources': ['Recruitment & Onboarding', 'Payroll Processing', 'Employee Performance Appraisal', 'Leave & Attendance Management', 'Exit / Offboarding Management'],
  'accounts & finance': ['Vendor Payment Processing', 'Invoice Processing', 'Statutory Tax Filings', 'Expense Reimbursement', 'Payroll Disbursement'],
  'accounts and finance': ['Vendor Payment Processing', 'Invoice Processing', 'Statutory Tax Filings', 'Expense Reimbursement', 'Payroll Disbursement'],
  finance: ['Vendor Payment Processing', 'Invoice Processing', 'Statutory Tax Filings', 'Expense Reimbursement'],
  legal: ['Contract Management', 'Litigation & Dispute Management', 'Regulatory Filings', 'Legal Advisory'],
  'company secretaryship': ['Board Meeting Management', 'Statutory Compliance Filings (ROC/MCA)', 'Shareholder Records Management', 'Annual Report Preparation'],
  compliance: ['Regulatory Compliance Monitoring', 'Policy Management', 'Internal Audit Coordination', 'Whistleblower / Grievance Handling'],
  procurement: ['Vendor Onboarding', 'Purchase Order Processing', 'Vendor Evaluation & Empanelment', 'Contract Negotiation'],
  sales: ['Lead Management', 'Order Processing', 'Customer Onboarding', 'Contract & Quotation Management'],
  marketing: ['Campaign Management', 'Customer Database Management', 'Market Research', 'Event Management'],
  it: ['User Access Management', 'IT Asset Management', 'System Administration', 'Helpdesk / Ticketing'],
  'information security': ['Access Control Management', 'Incident Response', 'Security Monitoring', 'Vulnerability Management'],
  'customer service': ['Customer Query Handling', 'Complaint Management', 'Feedback Collection'],
  payroll: ['Salary Processing', 'Statutory Deductions Filing', 'Full & Final Settlement'],
  operations: ['Order Fulfilment', 'Vendor Coordination', 'Quality Assurance'],
  logistics: ['Shipment Tracking', 'Dispatch Management', 'Fleet Management'],
};

export function getSuggestedProcesses(deptName: string): string[] {
  const key = (deptName || '').toLowerCase().trim();
  for (const k of Object.keys(PROCESS_SEED_BY_DEPT)) {
    if (key.includes(k) || k.includes(key)) return PROCESS_SEED_BY_DEPT[k];
  }
  return ['General Record Keeping', 'Internal Reporting'];
}

export const DEFAULT_BRANDING = {
  companyName: 'NICS',
  tagline: 'Trusted Expertise | Intelligent Solutions | Enduring Value',
  consultant: 'Vikas Jangid',
  designation: 'Internal Audit Head | DPDP Consultant',
  phone: '9632466477',
  navy: '#1B2A5B',
  royal: '#1F4E9C',
  teal: '#0F7B7A',
  orange: '#E8721E',
  logo: '',
  partnerLogo: '',
  partnerFirm: '',
  partnerTagline: '',
  partnerContact: '',
  partnerDesignation: '',
  partnerEmail: '',
  partnerPhone: '',
  partnerAddress: '',
};

export function defaultState(): AppState {
  return {
    branding: { ...DEFAULT_BRANDING },
    org: { groups: [], entities: [], departments: [], processes: [], activities: [] },
    inventory: { datasets: [] },
    thirdParties: { list: [] },
    signoffs: { list: [] },
    settings: {
      personalDataOptions: [...DEFAULT_PERSONAL_DATA_OPTIONS],
      mediumOptions: [...DEFAULT_MEDIUM_OPTIONS],
      departmentSeedOptions: [...DEFAULT_DEPARTMENT_SEED],
      softwareOptions: [...DEFAULT_SOFTWARE_OPTIONS],
      infoPassedOptions: [...DEFAULT_INFO_PASSED_OPTIONS],
    },
    clients: [],
  };
}

export interface NavItem {
  tab: string;
  icon: string;
  label: string;
}

export const ALL_NAV: NavItem[] = [
  { tab: 'dashboard', icon: '\u25A0', label: 'Dashboard' },
  { tab: 'org', icon: '\u229E', label: 'Organisation Structure' },
  { tab: 'department', icon: '\u2637', label: 'Department' },
  { tab: 'inventory', icon: '\u2630', label: 'Data Inventory' },
  { tab: 'thirdparty', icon: '\u21C4', label: 'Third Parties' },
  { tab: 'reports', icon: '\u2709', label: 'Reports & Sign-off' },
  { tab: 'users', icon: '\u263A', label: 'Users & Logins' },
  { tab: 'settings', icon: '\u2699', label: 'Branding & Settings' },
];

export function navFor(role: Role, adminScopeCompany: boolean): NavItem[] {
  const all = new Set(['dashboard', 'department', 'inventory', 'thirdparty', 'reports']);
  if (role !== 'department') all.add('org');
  if (role === 'department') {
    // Department logins have no branding/settings, org structure or user management.
    return ALL_NAV.filter((n) => all.has(n.tab));
  }
  if (role === 'admin') {
    // Only the admin manages branding/settings (platform-level configuration).
    const set = new Set(all);
    set.add('settings');
    if (adminScopeCompany) set.add('users');
    return ALL_NAV.filter((n) => set.has(n.tab));
  }
  // Client logins manage users but not branding/settings.
  const set = new Set(all);
  set.add('users');
  return ALL_NAV.filter((n) => set.has(n.tab));
}

export const DEMO_ACCOUNTS = [
  { label: 'Admin (all companies)', username: 'admin', password: 'admin123' },
  { label: 'Client company login', username: 'admin@demo.com', password: 'client123' },
  { label: 'Department login - HR', username: 'hr', password: 'hr123' },
  { label: 'Department login - IT', username: 'it', password: 'it123' },
];

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  client: 'Client',
  department: 'Department',
};

export const TAB_TITLES: Record<string, [string, string]> = {
  dashboard: ['Dashboard', 'Discovery completeness, risk exposure and organisation snapshot'],
  org: ['Organisation Structure', 'Group, legal entity, department, process and activity hierarchy'],
  department: ['Department', 'Department master list with head details, contacts and standard department presets'],
  inventory: ['Data Inventory', 'Personal data sets, purpose, systems, sharing and retention'],
  thirdparty: ['Third Parties', 'Vendors and processors receiving personal data'],
  reports: ['Reports & Sign-off', 'Generate management reports with client acknowledgement'],
  users: ['Users & Logins', 'Create, delete and assign department login accounts for this company'],
  settings: ['Branding & Settings', 'Configure workspace branding and sample data'],
};

export type FieldType =
  | 'select'
  | 'select-dept'
  | 'select-process'
  | 'select-group'
  | 'select-entity'
  | 'select-entity-dept'
  | 'select-thirdparty'
  | 'multichips'
  | 'textarea'
  | 'number'
  | 'text';

export interface FieldDef {
  key: string;
  label: string;
  required?: boolean;
  type?: FieldType;
  options?: string[];
  def?: string;
  list?: string;
  readOnly?: boolean;
  chipsMaster?: string;
  hint?: string;
}

export const FIELD_DEFS: Record<string, FieldDef[]> = {
  group: [
    { key: 'name', label: 'Group Name', required: true },
    { key: 'parentGroupId', label: 'Parent Organisation (if a subsidiary group)', type: 'select-group' },
    { key: 'holdingPercent', label: '% of Holding (held by parent)', type: 'number' },
    { key: 'hqCountry', label: 'HQ Country' },
    { key: 'dpo', label: 'DPO / Privacy Contact' },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], def: 'Active' },
  ],
  entity: [
    { key: 'legalName', label: 'Legal Entity Name', required: true },
    { key: 'tradingName', label: 'Trading Name' },
    { key: 'parentEntityId', label: 'Parent Entity (if a subsidiary)', type: 'select-entity' },
    { key: 'holdingPercent', label: '% of Holding (held by parent/group)', type: 'number' },
    { key: 'country', label: 'Country' },
    { key: 'industry', label: 'Industry' },
    { key: 'employeeCount', label: 'Employee Count', type: 'number' },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], def: 'Active' },
  ],
  department: [
    { key: 'name', label: 'Department Name', required: true, list: 'deptList' },
    { key: 'entityId', label: 'Legal Entity (optional)', type: 'select-entity-dept' },
    { key: 'headContact', label: 'Department Head Name' },
    { key: 'headDesignation', label: 'Department Head Designation' },
    { key: 'headEmail', label: 'Head Contact Email' },
    { key: 'headPhone', label: 'Head Contact Number' },
    { key: 'employeeCount', label: 'Number of Employees', type: 'number' },
    { key: 'location', label: 'Location' },
    { key: 'criticality', label: 'Criticality', type: 'select', options: ['High', 'Medium', 'Low'], def: 'Medium' },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], def: 'Active' },
  ],
  process: [
    { key: 'name', label: 'Process Name', required: true },
    { key: 'category', label: 'Category' },
    { key: 'owner', label: 'Process Owner Name' },
    { key: 'ownerContact', label: 'Process Owner Contact (Email/Phone)' },
    { key: 'reportingTo', label: 'Reporting To' },
    { key: 'frequency', label: 'Frequency', type: 'select', options: ['Daily', 'Weekly', 'Monthly', 'Ad-hoc'] },
    { key: 'manualAutomated', label: 'Manual / Automated', type: 'select', options: ['Manual', 'Automated', 'Hybrid'] },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], def: 'Active' },
  ],
  activity: [
    { key: 'name', label: 'Activity Name', required: true },
    { key: 'owner', label: 'Owner' },
    { key: 'frequency', label: 'Frequency', type: 'select', options: ['Daily', 'Weekly', 'Monthly', 'Ad-hoc'] },
    { key: 'manualAutomated', label: 'Manual / Automated', type: 'select', options: ['Manual', 'Automated', 'Hybrid'] },
  ],
  dataset: [
    { key: 'name', label: 'Data Set / Record Name', required: true },
    { key: 'departmentId', label: 'Department', type: 'select-dept', required: true },
    { key: 'processId', label: 'Process (optional)', type: 'select-process' },
    { key: 'personalData', label: 'Contains Personal Data?', type: 'select', options: ['Yes', 'No'], def: 'Yes' },
    { key: 'dataPrincipalType', label: 'Data Principal Type', type: 'select', options: ['Employee', 'Customer', 'Vendor', 'Candidate', 'Minor', 'Other'] },
    { key: 'sensitivity', label: 'Sensitivity', type: 'select', options: ['General', 'Sensitive', 'Critical'], def: 'General' },
    { key: 'dataElements', label: 'Data Elements (comma separated)', type: 'textarea' },
    { key: 'purpose', label: 'Purpose of Processing' },
    { key: 'purposeDocumented', label: 'Purpose Documented?', type: 'select', options: ['Yes', 'No'], def: 'No' },
    { key: 'source', label: 'Source / Collection Method' },
    { key: 'system', label: 'System / Application' },
    { key: 'storageLocation', label: 'Storage Location' },
    { key: 'hostingCountry', label: 'Hosting Country' },
    { key: 'sharedExternally', label: 'Shared Externally?', type: 'select', options: ['Yes', 'No'], def: 'No' },
    { key: 'thirdPartyId', label: 'Third Party / Recipient', type: 'select-thirdparty' },
    { key: 'crossBorder', label: 'Cross-Border Transfer?', type: 'select', options: ['Yes', 'No'], def: 'No' },
    { key: 'destinationCountry', label: 'Destination Country' },
    { key: 'retentionPeriod', label: 'Retention Period', type: 'number' },
    { key: 'retentionUnit', label: 'Retention Unit', type: 'select', options: ['Days', 'Months', 'Years'], def: 'Years' },
    { key: 'disposalMethod', label: 'Disposal Method' },
    { key: 'owner', label: 'Data / Process Owner' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  thirdparty: [
    { key: 'code', label: 'Vendor ID', readOnly: true, hint: 'Auto-generated' },
    { key: 'vendor', label: 'Vendor Name (Legal name)', required: true },
    { key: 'vendorStatus', label: 'Vendor Status', type: 'select', options: VENDOR_STATUS_OPTIONS, def: 'Active' },
    { key: 'type', label: 'Vendor Type', type: 'select', options: VENDOR_TYPE_OPTIONS, def: 'Data Processor' },
    { key: 'departmentCategory', label: 'Department Category', list: 'tpDeptCat', hint: 'e.g. HR, Payroll, IT, Cloud, Marketing, CRM, Finance' },
    { key: 'businessOwner', label: 'Business Owner', hint: 'Internal relationship owner' },
    { key: 'vendorContact', label: 'Vendor Contact', type: 'select', options: AVAILABILITY_OPTIONS, def: 'Available' },
    { key: 'contractOwner', label: 'Contract Owner', type: 'select', options: AVAILABILITY_OPTIONS, def: 'Available' },
    { key: 'processingActivity', label: 'Processing Activity', type: 'textarea', hint: 'Descriptive answer' },
    { key: 'purpose', label: 'Purpose of Processing', type: 'textarea', hint: 'Descriptive answer' },
    { key: 'personalDataCategories', label: 'Personal Data Category', type: 'multichips', chipsMaster: 'personalDataOptions', hint: 'Multiple options accepted' },
    { key: 'dataPrincipals', label: 'Data Principals', type: 'multichips', options: DATA_PRINCIPAL_OPTIONS, hint: 'Multiple options accepted' },
    { key: 'volume', label: 'Volume', hint: 'Approx. number of data principals' },
    { key: 'location', label: 'Location', type: 'select', options: TP_LOCATION_OPTIONS, def: 'India' },
    { key: 'systems', label: 'Systems', list: 'tpSystems', hint: 'Application / platform used' },
    { key: 'subProcessors', label: 'Sub-processors', type: 'select', options: YES_NO_DONT_KNOW, def: 'Do not know' },
    { key: 'dpaInPlace', label: 'Data Processing Agreement', type: 'select', options: AVAILABILITY_OPTIONS, def: 'Available' },
    { key: 'risk', label: 'Risk Rating', type: 'select', options: RISK_OPTIONS, def: 'Medium' },
  ],
};
