'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Department, Process } from '@/lib/types';
import { useApp } from '@/store/AppContext';
import { navFor } from '@/lib/constants';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Toast from './Toast';
import DashboardTab from './DashboardTab';
import OrgTreeTab from './OrgTreeTab';
import DepartmentTab from './DepartmentTab';
import InventoryTab from './InventoryTab';
import ThirdPartyTab from './ThirdPartyTab';
import ReportsTab from './ReportsTab';
import UsersTab from './UsersTab';
import SettingsTab from './SettingsTab';
import ProcessRegisterPage from './ProcessRegisterPage';
import Modal from './Modal';
import DataProfileModal from './DataProfileModal';
import ProcessDetailModal from './ProcessDetailModal';
import PrintModal from './PrintModal';

export interface GenericModalState {
  type: string;
  record: object | null;
  title: string;
  onSave: (rec: Record<string, unknown>) => void;
}

interface UiValue {
  openModal: (type: string, record: object | null, title: string, onSave: (rec: Record<string, unknown>) => void) => void;
  openDataProfile: (dep: Department) => void;
  openProcessRegister: (dep: Department) => void;
  openProcessDetail: (dep: Department, proc?: Process) => void;
  openPrint: (type: string) => void;
  setTab: (tab: string) => void;
}

const UiContext = createContext<UiValue | null>(null);

export function useUi(): UiValue {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used within App');
  return ctx;
}

export default function App() {
  const { role, isAdmin, scopeClientId, companyMode, loaded } = useApp();
  const nav = useMemo(
    () => navFor(role, isAdmin ? !!scopeClientId : true),
    [role, isAdmin, scopeClientId]
  );

  const [tab, setTabState] = useState('dashboard');
  const [procPageDep, setProcPageDep] = useState<Department | null>(null);
  const [genericModal, setGenericModal] = useState<GenericModalState | null>(null);
  const [dataProfileDep, setDataProfileDep] = useState<Department | null>(null);
  const [processModal, setProcessModal] = useState<{ dep: Department; proc?: Process } | null>(null);
  const [printType, setPrintType] = useState<string | null>(null);

  const navTabs = useMemo(() => new Set(nav.map((n) => n.tab)), [nav]);
  const safeTab = navTabs.has(tab) ? tab : 'dashboard';

  useEffect(() => {
    if (tab !== safeTab) setTabState(safeTab);
  }, [tab, safeTab]);

  // Changing company scope closes any open department register page that does
  // not belong to the newly selected company.
  useEffect(() => {
    if (!procPageDep) return;
    const cid = (procPageDep as { clientId?: string }).clientId || '';
    if (isAdmin && (!scopeClientId || (cid && cid !== scopeClientId))) {
      setProcPageDep(null);
    }
  }, [procPageDep, scopeClientId, isAdmin]);

  const setTab = (t: string) => {
    setProcPageDep(null);
    setTabState(t);
  };

  const openModal = (type: string, record: object | null, title: string, onSave: (rec: Record<string, unknown>) => void) =>
    setGenericModal({ type, record, title, onSave });

  const ui: UiValue = {
    openModal,
    openDataProfile: (dep) => setDataProfileDep(dep),
    openProcessRegister: (dep) => setProcPageDep(dep),
    openProcessDetail: (dep, proc) => setProcessModal({ dep, proc }),
    openPrint: (type) => setPrintType(type),
    setTab,
  };

  return (
    <UiContext.Provider value={ui}>
      <div id="app">
        <Sidebar tab={safeTab} setTab={setTab} />
        <div id="main">
          <Topbar tab={safeTab} titleOverride={procPageDep ? 'Process Register' : undefined} subtitleOverride={procPageDep ? procPageDep.name : undefined} />
          <div id="content">
            {procPageDep ? (
              <ProcessRegisterPage dep={procPageDep} onBack={() => setProcPageDep(null)} />
            ) : !loaded ? (
              <div className="empty-state" style={{ marginTop: 20 }}>
                Loading workspace data…
              </div>
            ) : (
              <TabView tab={safeTab} />
            )}
          </div>
        </div>
        {genericModal && (
          <Modal
            type={genericModal.type}
            record={genericModal.record}
            title={genericModal.title}
            onSave={genericModal.onSave}
            onClose={() => setGenericModal(null)}
          />
        )}
        {dataProfileDep && <DataProfileModal dep={dataProfileDep} onClose={() => setDataProfileDep(null)} />}
        {processModal && (
          <ProcessDetailModal dep={processModal.dep} proc={processModal.proc} onClose={() => setProcessModal(null)} />
        )}
        {printType && <PrintModal type={printType} onClose={() => setPrintType(null)} />}
        <Toast />
      </div>
    </UiContext.Provider>
  );
}

function TabView({ tab }: { tab: string }) {
  switch (tab) {
    case 'dashboard':
      return <DashboardTab />;
    case 'org':
      return <OrgTreeTab />;
    case 'department':
      return <DepartmentTab />;
    case 'inventory':
      return <InventoryTab />;
    case 'thirdparty':
      return <ThirdPartyTab />;
    case 'reports':
      return <ReportsTab />;
    case 'users':
      return <UsersTab />;
    case 'settings':
      return <SettingsTab />;
    default:
      return <DashboardTab />;
  }
}
