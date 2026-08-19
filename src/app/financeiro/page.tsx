'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Receipt,
  AlertCircle,
  CreditCard,
  DollarSign,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';

export default function FinanceiroVisaoGeralPage() {
  const [periodo, setPeriodo] = useState<'hoje' | '7dias' | 'mes' | 'ano'>('mes');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchFinanceiro = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?periodo=${periodo}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceiro();
  }, [periodo]);

  const formatCurrency = (val: number = 0) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Financeiro — Visão Geral
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Segregação rigorosa entre Faturamento (vendido) e Recebimentos (efetivamente em caixa)
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          {(['hoje', '7dias', 'mes', 'ano'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                periodo === p
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p === '7dias' ? '7 dias' : p}
            </button>
          ))}
          <button
            type="button"
            onClick={fetchFinanceiro}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary KPI Cards (Spec #7 & #19) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Faturamento"
          value={formatCurrency(data?.faturamento)}
          subtitle="Total de pedidos vendidos"
          icon={TrendingUp}
          variant="brand"
        />

        <StatCard
          title="Recebido"
          value={formatCurrency(data?.recebido)}
          subtitle="Efetivamente em caixa"
          icon={Receipt}
          variant="success"
        />

        <StatCard
          title="Em Aberto"
          value={formatCurrency(data?.emAberto)}
          subtitle="Fiados + Boletos a vencer"
          icon={AlertCircle}
          variant="warning"
        />

        <StatCard
          title="Despesas"
          value={formatCurrency(data?.despesas)}
          subtitle="Gastos da empresa"
          icon={CreditCard}
          variant="danger"
        />

        <StatCard
          title="Resultado"
          value={formatCurrency(data?.resultado)}
          subtitle="Recebido - Despesas"
          icon={DollarSign}
          variant={data && data.resultado >= 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Atalhos Rápidos para Módulos Financeiros (Spec #6 & #20) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card Recebimentos */}
        <Link
          href="/financeiro/recebimentos"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Receipt className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mt-3">Recebimentos</h3>
          <p className="text-xs text-slate-500 mt-1">
            Valores liquidados por PIX, Dinheiro, Débito, Crédito e Boletos pagos.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs font-bold text-emerald-700">
            Total recebido: {formatCurrency(data?.recebido)} →
          </div>
        </Link>

        {/* Card Fiados */}
        <Link
          href="/financeiro/fiados"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <AlertCircle className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mt-3">Fiados</h3>
          <p className="text-xs text-slate-500 mt-1">
            Controle de clientes devendo, quitação parcial ou total com histórico.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs font-bold text-amber-700">
            Em aberto: {formatCurrency(data?.fiadosResumo.valorTotalEmAberto)} ({data?.fiadosResumo.clientesDevendo} clientes) →
          </div>
        </Link>

        {/* Card Boletos a Receber */}
        <Link
          href="/financeiro/boletos"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-sky-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-200">
              <CreditCard className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mt-3">Boletos a Receber</h3>
          <p className="text-xs text-slate-500 mt-1">
            Controle de parcelas por pedido e baixa manual sem arquivo de PDF.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs font-bold text-sky-700">
            Em aberto: {formatCurrency(data?.boletosResumo.valorTotalEmAberto)} ({data?.boletosResumo.quantidadePendente} parcelas) →
          </div>
        </Link>

        {/* Card Despesas */}
        <Link
          href="/financeiro/despesas"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-rose-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
              <DollarSign className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mt-3">Despesas & Boletos a Pagar</h3>
          <p className="text-xs text-slate-500 mt-1">
            Combustível, manutenção, fornecedores, contas e boletos a pagar.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs font-bold text-rose-700">
            Total despesas: {formatCurrency(data?.despesas)} →
          </div>
        </Link>

        {/* Card Faturamento */}
        <Link
          href="/financeiro/faturamento"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-brand-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-brand-50 text-brand-600 border border-brand-200">
              <TrendingUp className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mt-3">Faturamento Analítico</h3>
          <p className="text-xs text-slate-500 mt-1">
            Relatórios por período (Diário, 7 dias, Mensal, Anual).
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs font-bold text-brand-700">
            Faturamento: {formatCurrency(data?.faturamento)} →
          </div>
        </Link>

        {/* Card Relatórios */}
        <Link
          href="/financeiro/relatorios"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-purple-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-200">
              <Calendar className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mt-3">Relatórios & DRE</h3>
          <p className="text-xs text-slate-500 mt-1">
            Demonstrativo de Resultado do Exercício e fechamento contábil simplificado.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs font-bold text-purple-700">
            Acessar demonstrativos →
          </div>
        </Link>
      </div>
    </div>
  );
}
