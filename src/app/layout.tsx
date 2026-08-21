import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'Água Belle — Sistema de Gestão',
  description: 'Sistema de gestão da Distribuidora Água Belle (Galões 20L)',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/manifest.webmanifest',
    apple: '/icons/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Água Belle',
  },
};

export const viewport: Viewport = {
  themeColor: '#0284c7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 antialiased font-sans">
        {/* Sidebar fixa à esquerda */}
        <Sidebar />

        {/* Conteúdo principal */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 bg-slate-50/80">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
