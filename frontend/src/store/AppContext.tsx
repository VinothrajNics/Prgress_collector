'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { AppState, StateKey } from '@/lib/types';
import { defaultState } from '@/lib/constants';
import { api } from '@/lib/api';

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
}

const AppContext = createContext<AppContextValue | null>(null);

const SAVERS: Record<StateKey, (v: unknown) => Promise<unknown>> = {
  branding: api.saveBranding,
  org: api.saveOrg,
  inventory: api.saveInventory,
  thirdParties: api.saveThirdParties,
  signoffs: api.saveSignoffs,
  settings: api.saveSettings,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState());
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [toastMsg, setToastMsg] = useState<ToastMsg | null>(null);

  const stateRef = useRef<AppState>(state);
  stateRef.current = state;

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((msg: string, isError = false) => {
    setToastMsg({ text: msg, error: isError });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2400);
  }, []);

  useEffect(() => {
    api
      .getAll()
      .then((data) => {
        const next = { ...defaultState(), ...(data as Partial<AppState>) };
        next.org = { ...defaultState().org, ...(next.org || {}) };
        next.inventory = { datasets: next.inventory?.datasets || [] };
        next.thirdParties = { list: next.thirdParties?.list || [] };
        next.signoffs = { list: next.signoffs?.list || [] };
        next.settings = { ...defaultState().settings, ...(next.settings || {}) };
        stateRef.current = next;
        setState(next);
      })
      .catch(() => toast('Failed to load data from backend — is it running?', true))
      .finally(() => setLoaded(true));
  }, [toast]);

  const mutate = useCallback(
    <K extends StateKey>(key: K, updater: (current: AppState[K]) => AppState[K]) => {
      const current = stateRef.current[key];
      const next = updater(current);
      const newState = { ...stateRef.current, [key]: next };
      stateRef.current = newState;
      setState(newState);
      setSavedAt(new Date());
      SAVERS[key](next).catch(() => toast('Save failed — check backend connection', true));
      return next;
    },
    [toast]
  );

  const value: AppContextValue = {
    state,
    loaded,
    savedAt,
    toastMsg,
    mutate,
    toast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
