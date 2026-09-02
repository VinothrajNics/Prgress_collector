export interface Branding {
  companyName: string;
  tagline: string;
  consultant: string;
  designation: string;
  phone: string;
  navy: string;
  royal: string;
  teal: string;
  orange: string;
  logo: string;
  partnerLogo: string;
  partnerFirm: string;
  partnerTagline: string;
  partnerContact: string;
  partnerDesignation: string;
  partnerEmail: string;
  partnerPhone: string;
  partnerAddress: string;
}

export interface Group {
  id: string;
  name: string;
  parentGroupId: string;
  holdingPercent: string;
  hqCountry: string;
  dpo: string;
  status: string;
}

export interface Entity {
  id: string;
  groupId: string;
  legalName: string;
  tradingName: string;
  parentEntityId: string;
  holdingPercent: string;
  country: string;
  industry: string;
  employeeCount: string;
  status: string;
}

export interface Department {
  id: string;
  entityId: string;
  name: string;
  headContact: string;
  headDesignation: string;
  headEmail: string;
  headPhone: string;
  employeeCount: string;
  location: string;
  criticality: string;
  status: string;
  personalDataCollected: string[];
  mediumOfCollection: string[];
  retentionYears: string;
  retentionMonths: string;
  deviceUsed: string;
}

export interface Process {
  id: string;
  departmentId: string;
  name: string;
  category: string;
  owner: string;
  ownerContact: string;
  reportingTo: string;
  frequency: string;
  manualAutomated: string;
  status: string;
  personalInfoCollected: string[];
  modeOfCollection: string[];
  retentionYears: string;
  retentionMonths: string;
  softwareList: string[];
  storageLocation: string;
  infoPassed: string[];
}

export interface Activity {
  id: string;
  processId: string;
  name: string;
  owner: string;
  frequency: string;
  manualAutomated: string;
}

export interface Dataset {
  id: string;
  name: string;
  departmentId: string;
  processId: string;
  personalData: string;
  dataPrincipalType: string;
  sensitivity: string;
  dataElements: string;
  purpose: string;
  purposeDocumented: string;
  source: string;
  system: string;
  storageLocation: string;
  hostingCountry: string;
  sharedExternally: string;
  thirdPartyId: string;
  crossBorder: string;
  destinationCountry: string;
  retentionPeriod: string;
  retentionUnit: string;
  disposalMethod: string;
  owner: string;
  notes: string;
}

export interface ThirdParty {
  id: string;
  code?: string;
  clientId?: string;
  vendor: string;
  vendorStatus: string;
  type: string;
  departmentCategory: string;
  businessOwner: string;
  vendorContact: string;
  contractOwner: string;
  processingActivity: string;
  purpose: string;
  personalDataCategories: string[];
  dataPrincipals: string[];
  volume: string;
  location: string;
  systems: string;
  subProcessors: string;
  dpaInPlace: string;
  risk: string;
}

export interface Signoff {
  id: string;
  report: string;
  reportType?: string;
  content?: string;
  generated: string;
  status: string;
  clientName: string;
  clientDesig: string;
  clientEmail: string;
  clientDate: string;
}

export type Role = 'admin' | 'client' | 'department';

export interface AuthUser {
  id: string;
  clientId: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  status: string;
  departmentIds: string[];
  clientName: string;
}

export interface ClientLite {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  status: string;
}

export interface ClientSummary extends ClientLite {
  createdAt: string;
  counts: Record<string, number>;
  users: number;
  clientLogins: number;
  deptLogins: number;
}

export interface WorkspaceUser {
  id: string;
  clientId: string;
  username: string;
  role: Role;
  name: string;
  email: string;
  status: string;
  departmentIds: string[];
}

export interface Settings {
  personalDataOptions: string[];
  mediumOptions: string[];
  departmentSeedOptions: string[];
  softwareOptions: string[];
  infoPassedOptions: string[];
}

export interface OrgState {
  groups: Group[];
  entities: Entity[];
  departments: Department[];
  processes: Process[];
  activities: Activity[];
}

export interface AppState {
  branding: Branding;
  org: OrgState;
  inventory: { datasets: Dataset[] };
  thirdParties: { list: ThirdParty[] };
  signoffs: { list: Signoff[] };
  settings: Settings;
  clients: ClientLite[];
}

export type StateKey = 'branding' | 'org' | 'inventory' | 'thirdParties' | 'signoffs' | 'settings';
