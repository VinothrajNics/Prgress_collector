'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { AppState, AuthUser, ClientLite, Role, StateKey } from '@/lib/types';
import { defaultState } from '@/lib/constants';
import { api } from '@/lib/api';
import { useSession } from './SessionContext';

export interface ToastMsg {
  text: string;
  error?: boolean;
}

interface AppContextValue {
  state: AppState;
  loaded: boolean;
  savedAt: Date | null;
  toastMsg: ToastMsg | null;
  mutate: <K extends StateKey>(key: K, updater: (current: AppState[K]) => AppState[K]) => AppState[K];
  toast: (msg: string, isError?: boolean) => void;

  user: AuthUser;
  role: Role;
  isAdmin: boolean;
  scopeClientId: string;
  setScopeClientId: (id: string) => void;
  companyMode: boolean;
  canEdit: boolean;
  showCompany: boolean;
  clients: ClientLite[];
  clientNameOf: (id: string) => string;
  reload: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const SAVERS: Record<StateKey, (v: unknown, clientId?: string) => Promise<unknown>> = {
  branding: api.saveBranding,
  org: api.saveOrg,
  inventory: api.saveInventory,
  thirdParties: api.saveThirdParties,
  signoffs: api.saveSignoffs,
  settings: api.saveSettings,
};

function normalize(data: AppState): AppState {
  const next = { ...defaultState(), ...(data || {}) };
  next.branding = { ...defaultState().branding, ...(next.branding || {}) };
  next.org = { ...defaultState().org, ...(next.org || {}) };
  next.inventory = { datasets: next.inventory?.datasets || [] };
  next.thirdParties = { list: next.thirdParties?.list || [] };
  next.signoffs = { list: next.signoffs?.list || [] };
  next.settings = { ...defaultState().settings, ...(next.settings || {}) };
  next.clients = Array.isArray(next.clients) ? next.clients : [];
  return next;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const [state, setState] = useState<AppState>(defaultState());
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [toastMsg, setToastMsg] = useState<ToastMsg | null>(null);
  const [scopeClientId, setScopeClientId] = useState<string>('');
  const [refreshTick, setRefreshTick] = useState(0);

  const stateRef = useRef<AppState>(state);
  stateRef.current = state;

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((msg: string, isError = false) => {
    setToastMsg({ text: msg, error: isError });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3000);
  }, []);

  const role = user ? user.role : 'admin';
  const isAdmin = role === 'admin';

  // When the signed-in user changes, reset the admin scope.
  useEffect(() => {
    if (user && !isAdmin) setScopeClientId(user.clientId || '');
    if (user && isAdmin) setScopeClientId('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoaded(false);
    const clientId = isAdmin && scopeClientId ? scopeClientId : undefined;
    api
      .getAll(clientId)
      .then((data) => {
        if (!active) return;
        const next = normalize(data as AppState);
        stateRef.current = next;
        setState(next);
      })
      .catch(() => toast('Failed to load data from backend — is it running?', true))
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, scopeClientId, refreshTick, isAdmin]);

  const reload = useCallback(() => setRefreshTick((t) => t + 1), []);

  const mutate = useCallback(
    <K extends StateKey>(key: K, updater: (current: AppState[K]) => AppState[K]) => {
      const current = stateRef.current[key];
      const next = updater(current);
      const newState = { ...stateRef.current, [key]: next };
      stateRef.current = newState;
      setState(newState);
      setSavedAt(new Date());
      const saveClientId = isAdmin && scopeClientId ? scopeClientId : undefined;
      if (key === 'branding' || key === 'settings') {
        // Branding & settings are platform-level config the admin edits globally.
        SAVERS[key](next, undefined).catch(() => toast('Save failed — check backend connection', true));
        return next;
      }
      if (isAdmin && !saveClientId) return next; // aggregate admin view is read-only
      SAVERS[key](next, saveClientId).catch(() => toast('Save failed — check backend connection', true));
      return next;
    },
    [toast, isAdmin, scopeClientId]
  );

  const companyMode = isAdmin ? !!scopeClientId : true;
  const canEdit = isAdmin ? !!scopeClientId : true;
  const showCompany = isAdmin && !scopeClientId;
  const clients: ClientLite[] = Array.isArray(state.clients) ? state.clients : [];

  const clientNameOf = useCallback(
    (id: string) => {
      if (!id) return '';
      const c = clients.find((x) => x.id === id);
      return c ? c.companyName : id;
    },
    [clients]
  );

  if (!user) return null;

  const value: AppContextValue = {
    state,
    loaded,
    savedAt,
    toastMsg,
    mutate,
    toast,
    user,
    role,
    isAdmin,
    scopeClientId,
    setScopeClientId,
    companyMode,
    canEdit,
    showCompany,
    clients,
    clientNameOf,
    reload,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
