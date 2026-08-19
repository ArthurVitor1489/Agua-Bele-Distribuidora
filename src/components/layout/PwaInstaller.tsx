'use client';

import React, { useState, useEffect } from 'react';
import { Download, MonitorCheck, Sparkles } from 'lucide-react';

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (typeof window !== 'undefined') {
      // Check if app is running in standalone mode (already installed)
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }

      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handler);

      window.addEventListener('appinstalled', () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
      });

      // Register Service Worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/sw.js')
          .then(() => console.log('SW registrado com sucesso'))
          .catch((err) => console.warn('Erro ao registrar SW:', err));
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }
  }, []);

  if (!mounted) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert('Para instalar o Água Belle no Windows, use o menu do seu navegador (três pontinhos no canto superior) e clique em "Instalar Água Belle" ou "Criar Atalho".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
        <MonitorCheck className="w-4 h-4 text-emerald-600" />
        <span>Instalado no Windows</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-all active:scale-[0.98]"
      title="Instalar como aplicativo no Windows"
    >
      <Download className="w-3.5 h-3.5 text-sky-600 animate-bounce" />
      <span>Instalar no Windows</span>
    </button>
  );
}
