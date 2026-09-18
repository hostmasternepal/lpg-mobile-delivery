import type { Metadata } from 'next';
import { NavBar } from '@/components/nav-bar';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'LPG Emergency Priority Delivery System',
  description: 'MoICS/NOC digital complaint-to-delivery system for LPG emergency priority delivery.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NavBar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
