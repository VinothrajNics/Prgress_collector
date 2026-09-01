import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NICS | DPDP Data Discovery',
  description: 'DPDP Data Discovery Workspace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
