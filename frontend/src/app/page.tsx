'use client';

import { SessionProvider, useSession } from '@/store/SessionContext';
import { AppProvider } from '@/store/AppContext';
import App from '@/components/App';
import LoginScreen from '@/components/LoginScreen';

function Root() {
  const { user, initializing } = useSession();
  if (initializing) {
    return (
      <div className="login-shell">
        <div className="login-card">
          <div className="empty-state" style={{ margin: 0 }}>
            Loading session…
          </div>
        </div>
      </div>
    );
  }
  if (!user) return <LoginScreen />;
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}

export default function Page() {
  return (
    <SessionProvider>
      <Root />
    </SessionProvider>
  );
}
