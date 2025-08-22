import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@/styles/global.css';
import Sidebar from '@/components/common/sidebar';
import { ThemeProvider } from '@/components/common/themeprovider';
import { AuthProvider } from '@/components/common/Auth-Provider';
import { ReactQueryProvider } from '@/components/common/ReactQueryProvider';
import { getSession } from '@/lib/session';
import AuthComponent from './login/login';
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Avatar Admin',
  description: 'Avatar Admin',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = await getSession();
  return (
        <ReactQueryProvider>
          <ThemeProvider defaultTheme="system">
            <Toaster />
            <AuthProvider session={session}>
              {session ? (
                <div className="flex">
                  <Sidebar />
                  <div className="flex-grow">{children}</div>
                </div>
              ) : (
                <AuthComponent />
              )}
            </AuthProvider>
          </ThemeProvider>
        </ReactQueryProvider>
  );
}
