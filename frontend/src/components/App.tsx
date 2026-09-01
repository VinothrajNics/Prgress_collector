'use client';

import { createContext, useContext, useState } from 'react';
import type { Department, Process } from '@/lib/types';
import { useApp } from '@/store/AppContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Toast from './Toast';
import DashboardTab from './DashboardTab';
import OrgTreeTab from './OrgTreeTab';
import DepartmentTab from './DepartmentTab';
import InventoryTab from './InventoryTab';
import ThirdPartyTab from './ThirdPartyTab';
import ReportsTab from './ReportsTab';
import SettingsTab from './SettingsTab';
import Modal from './Modal';
import DataProfileModal from './DataProfileModal';
import DeptProcessModal from './DeptProcessModal';
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
  openDeptProcess: (dep: Department) => void;
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
  const [tab, setTab] = useState('dashboard');
  const [genericModal, setGenericModal] = useState<GenericModalState | null>(null);
  const [dataProfileDep, setDataProfileDep] = useState<Department | null>(null);
  const [deptProcessDep, setDeptProcessDep] = useState<Department | null>(null);
  const [processModal, setProcessModal] = useState<{ dep: Department; proc?: Process } | null>(null);
  const [printType, setPrintType] = useState<string | null>(null);

  const openModal = (type: string, record: object | null, title: string, onSave: (rec: Record<string, unknown>) => void) =>
    setGenericModal({ type, record, title, onSave });

  const ui: UiValue = {
    openModal,
    openDataProfile: (dep) => setDataProfileDep(dep),
    openDeptProcess: (dep) => setDeptProcessDep(dep),
    openProcessDetail: (dep, proc) => setProcessModal({ dep, proc }),
    openPrint: (type) => setPrintType(type),
    setTab,
  };

  return (
    <UiContext.Provider value={ui}>
      <div id="app">
        <Sidebar tab={tab} setTab={setTab} />
        <div id="main">
          <Topbar tab={tab} />
          <div id="content">
            <DashboardShell tab={tab} />
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
        {deptProcessDep && <DeptProcessModal dep={deptProcessDep} onClose={() => setDeptProcessDep(null)} />}
        {processModal && (
          <ProcessDetailModal dep={processModal.dep} proc={processModal.proc} onClose={() => setProcessModal(null)} />
        )}
        {printType && <PrintModal type={printType} onClose={() => setPrintType(null)} />}
        <Toast />
      </div>
    </UiContext.Provider>
  );
}

function DashboardShell({ tab }: { tab: string }) {
  const { loaded } = useApp();
  const ui = useUi();
  if (!loaded) {
    return (
      <div className="empty-state" style={{ marginTop: 20 }}>
        Loading workspace data…
      </div>
    );
  }
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
    case 'settings':
      return <SettingsTab />;
    default:
      return <DashboardTab />;
  }
}
