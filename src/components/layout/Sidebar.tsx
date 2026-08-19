'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Boxes,
  DollarSign,
  Receipt,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  CreditCard,
  FileCheck2,
  Database,
  Settings,
  ChevronDown,
  ChevronRight,
  Droplets,
  AlertCircle,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const [financeiroAberto, setFinanceiroAberto] = useState(
    pathname.startsWith('/financeiro')
  );

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname === path;
  };

  const isSubActive = (path: string) => pathname === path;

  return (
    <aside className="w-64 bg-navy-950 text-slate-300 flex flex-col h-screen select-none border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-800 bg-navy-900/80">
        <div className="w-9 h-9 rounded-lg overflow-hidden border border-brand-500/40 shrink-0">
          <img src="/favicon.ico" alt="Água Belle" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
            ÁGUA BELLE
          </h1>
          <p className="text-xs text-brand-400/80 font-medium">Sistema de Gestão</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 text-sm">
        {/* Dashboard */}
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
            isActive('/')
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
              : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>

        {/* Clientes */}
        <Link
          href="/clientes"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
            isActive('/clientes')
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
              : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Clientes</span>
        </Link>

        {/* Pedidos */}
        <Link
          href="/pedidos"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
            isActive('/pedidos')
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
              : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Pedidos</span>
        </Link>

        {/* Produtos */}
        <Link
          href="/produtos"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
            isActive('/produtos')
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
              : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Produtos</span>
        </Link>

        {/* Estoque */}
        <Link
          href="/estoque"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
            isActive('/estoque')
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
              : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Estoque</span>
        </Link>

        {/* Financeiro (Collapsible Dropdown strictly matching Spec #6) */}
        <div>
          <button
            type="button"
            onClick={() => setFinanceiroAberto(!financeiroAberto)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-all ${
              pathname.startsWith('/financeiro')
                ? 'bg-slate-800/90 text-brand-300'
                : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Financeiro</span>
            </div>
            {financeiroAberto ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {financeiroAberto && (
            <div className="pl-4 pr-1 py-1 space-y-1 mt-1 border-l-2 border-slate-700 ml-4">
              <Link
                href="/financeiro"
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isSubActive('/financeiro')
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Visão geral</span>
              </Link>
              <Link
                href="/financeiro/recebimentos"
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isSubActive('/financeiro/recebimentos')
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Recebimentos</span>
              </Link>
              <Link
                href="/financeiro/fiados"
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isSubActive('/financeiro/fiados')
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Fiados</span>
              </Link>
              <Link
                href="/financeiro/boletos"
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isSubActive('/financeiro/boletos')
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Boletos</span>
              </Link>
              <Link
                href="/financeiro/despesas"
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isSubActive('/financeiro/despesas')
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <span>Despesas</span>
              </Link>
              <Link
                href="/financeiro/faturamento"
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isSubActive('/financeiro/faturamento')
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Faturamento</span>
              </Link>
              <Link
                href="/financeiro/relatorios"
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isSubActive('/financeiro/relatorios')
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Relatórios</span>
              </Link>
            </div>
          )}
        </div>

        {/* Notas Fiscais */}
        <Link
          href="/notas-fiscais"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
            isActive('/notas-fiscais')
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
              : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Notas Fiscais</span>
        </Link>

        {/* Backup */}
        <Link
          href="/backup"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
            isActive('/backup')
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
              : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Backup</span>
        </Link>

        {/* Configurações */}
        <Link
          href="/configuracoes"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
            isActive('/configuracoes')
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
              : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configurações</span>
        </Link>
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-navy-900/50">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300">V1.0.0</span>
          <span className="text-[11px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded font-mono">
            Desktop PWA
          </span>
        </div>
      </div>
    </aside>
  );
}
