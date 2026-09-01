'use client';

import { useApp } from '@/store/AppContext';

export default function Toast() {
  const { toastMsg } = useApp();
  if (!toastMsg) return null;
  return (
    <div
      id="toast"
      style={{ display: 'block', background: toastMsg.error ? '#C0392B' : undefined }}
    >
      {toastMsg.text}
    </div>
  );
}
