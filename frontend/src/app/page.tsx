'use client';

import { AppProvider } from '@/store/AppContext';
import App from '@/components/App';

export default function Page() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}
