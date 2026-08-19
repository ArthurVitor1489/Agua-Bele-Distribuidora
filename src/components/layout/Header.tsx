'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Download,
  Calendar,
  Clock,
  ShieldCheck,
  PackagePlus,
  RefreshCw,
} from 'lucide-react';
import { PwaInstaller } from './PwaInstaller';

export function Header() {
  const [dataAtual, setDataAtual] = useState('');
  const [horaAtual, setHoraAtual] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDataAtual(
        now.toLocaleDateString('pt-BR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      );
      setHoraAtual(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm shrink-0 no-print">
      {/* Search / Context */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-brand-600" />
          <span className="capitalize">{dataAtual}</span>
          <span className="text-slate-300">|</span>
          <Clock className="w-3.5 h-3.5 text-brand-600" />
          <span className="font-mono text-slate-700">{horaAtual}</span>
        </div>
      </div>

      {/* Relógio e Data */}
      <div className="flex items-center gap-3">
        {/* Espaço reservado para ações adicionais no futuro */}
      </div>
    </header>
  );
}
