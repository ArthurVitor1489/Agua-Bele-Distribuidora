'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  AlertCircle,
  CreditCard,
  Boxes,
  ShoppingCart,
  Receipt,
  FileCheck2,
  Calendar,
  RefreshCw,
  Droplets,
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { DashboardMetricsDTO } from '@/types';

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState<'hoje' | '7dias' | 'mes' | 'ano'>('mes');
  const [metrics, setMetrics] = useState<DashboardMetricsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?periodo=${periodo}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (e) {
      console.error('Erro ao carregar métricas:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [periodo]);

  const formatCurrency = (val: number = 0) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Section / Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Painel de Gestão</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visão financeira e operacional em tempo real da Água Belle
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => setPeriodo('hoje')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              periodo === 'hoje'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => setPeriodo('7dias')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              periodo === '7dias'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Últimos 7 dias
          </button>
          <button
            type="button"
            onClick={() => setPeriodo('mes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              periodo === 'mes'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Este Mês
          </button>
          <button
            type="button"
            onClick={() => setPeriodo('ano')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              periodo === 'ano'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Este Ano
          </button>
          <button
            type="button"
            onClick={fetchDashboard}
            title="Atualizar dados"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5 Primary Executive KPI Cards (Spec #7) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Faturamento */}
        <StatCard
          title="Faturamento"
          value={formatCurrency(metrics?.faturamento)}
          subtitle="Total vendido"
          icon={TrendingUp}
          variant="brand"
        />

        {/* 2. Recebido */}
        <StatCard
          title="Recebido"
          value={formatCurrency(metrics?.recebido)}
          subtitle="Efetivamente em caixa"
          icon={Receipt}
          variant="success"
        />

        {/* 3. Em Aberto */}
        <StatCard
          title="Em Aberto"
          value={formatCurrency(metrics?.emAberto)}
          subtitle="Fiados + Boletos pendentes"
          icon={AlertCircle}
          variant="warning"
        />

        {/* 4. Despesas */}
        <StatCard
          title="Despesas"
          value={formatCurrency(metrics?.despesas)}
          subtitle="Gastos operacionais"
          icon={CreditCard}
          variant="danger"
        />

        {/* 5. Resultado Líquido */}
        <StatCard
          title="Resultado"
          value={formatCurrency(metrics?.resultado)}
          subtitle="Recebido — Despesas"
          icon={DollarSign}
          variant={metrics && metrics.resultado >= 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Grid: Meios de Pagamento Efetivos vs Pedidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detalhamento por Meio de Pagamento Efetivo (Spec #8) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Recebimentos Efetivos por Forma de Pagamento
              </h3>
              <p className="text-xs text-slate-500">
                Apenas valores liquidados (Fiado não entra como recebido até ser pago)
              </p>
            </div>
            <Link
              href="/financeiro/recebimentos"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Ver todos <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {metrics?.recebimentoPorForma.map((item) => (
              <div
                key={item.forma}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex flex-col justify-between"
              >
                <span className="text-[11px] font-bold text-slate-600 uppercase">
                  {item.forma === 'BOLETO' ? 'Boleto Pago' : item.forma}
                </span>
                <p className="text-base font-bold text-slate-900 mt-2">
                  {formatCurrency(item.valor)}
                </p>
                <span className="text-[10px] text-slate-400 mt-1">
                  {item.quantidade} transaç{item.quantidade === 1 ? 'ão' : 'ões'}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Summary Alert for Fiados vs Boletos */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-900">Fiados em Aberto</span>
                <p className="text-xs text-amber-700 mt-0.5">
                  {metrics?.fiadosResumo.clientesDevendo} clientes devendo
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-amber-950">
                  {formatCurrency(metrics?.fiadosResumo.valorTotalEmAberto)}
                </span>
                <Link
                  href="/financeiro/fiados"
                  className="block text-[11px] font-semibold text-amber-800 hover:underline mt-0.5"
                >
                  Cobrar / Quitar →
                </Link>
              </div>
            </div>

            <div className="p-3 bg-sky-50/70 border border-sky-200/80 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-sky-900">Boletos a Receber</span>
                <p className="text-xs text-sky-700 mt-0.5">
                  {metrics?.boletosResumo.quantidadePendente} pendentes | {metrics?.boletosResumo.quantidadeVencida} vencidos
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-sky-950">
                  {formatCurrency(metrics?.boletosResumo.valorTotalEmAberto)}
                </span>
                <Link
                  href="/financeiro/boletos"
                  className="block text-[11px] font-semibold text-sky-800 hover:underline mt-0.5"
                >
                  Dar Baixa →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Status dos Pedidos (Spec #9) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Status dos Pedidos</h3>
              <Link
                href="/pedidos"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                Ver todos <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {metrics?.pedidosPorStatus.map((p) => {
                const colors: Record<string, string> = {
                  PENDENTE: 'bg-amber-50 text-amber-800 border-amber-200',
                  EM_ANDAMENTO: 'bg-sky-50 text-sky-800 border-sky-200',
                  ENTREGUE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                  CANCELADO: 'bg-rose-50 text-rose-800 border-rose-200',
                };
                const labels: Record<string, string> = {
                  PENDENTE: 'Pendentes',
                  EM_ANDAMENTO: 'Em Andamento',
                  ENTREGUE: 'Entregues',
                  CANCELADO: 'Cancelados',
                };
                return (
                  <div
                    key={p.status}
                    className={`flex items-center justify-between p-2.5 rounded-lg border ${colors[p.status]}`}
                  >
                    <span className="text-xs font-semibold">{labels[p.status]}</span>
                    <div className="text-right">
                      <span className="text-xs font-bold">{p.quantidade} pedidos</span>
                      <span className="text-[11px] block opacity-80">
                        {formatCurrency(p.valorTotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/pedidos?action=new"
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Criar Novo Pedido
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Estoque de Garrafões & Resumo Fiscal (Spec #9) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estoque de Garrafões (Spec #9 & #31) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-brand-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Estoque de Garrafões de 25L (Controle por Quantidade/Lote)
                </h3>
                <p className="text-xs text-slate-500">
                  Garrafões não possuem rastreio individual. Validade de 3 anos a partir da fabricação.
                </p>
              </div>
            </div>
            <Link
              href="/estoque"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Gerenciar Estoque <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Situações dos Garrafões (Spec #31 & #33) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="text-xs font-bold text-emerald-800">CHEIOS (Prontos)</span>
              <p className="text-xl font-bold text-emerald-950 mt-1">
                {metrics?.estoqueResumo.garrafoesCheios || 0}
              </p>
              <span className="text-[10px] text-emerald-700">Disponíveis p/ entrega</span>
            </div>

            <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg">
              <span className="text-xs font-bold text-sky-800">VAZIOS (Depósito)</span>
              <p className="text-xl font-bold text-sky-950 mt-1">
                {metrics?.estoqueResumo.garrafoesVazios || 0}
              </p>
              <span className="text-[10px] text-sky-700">Aguardando envase</span>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
              <span className="text-xs font-bold text-rose-800">DANIFICADOS</span>
              <p className="text-xl font-bold text-rose-950 mt-1">
                {(metrics?.estoqueResumo.garrafoesDanificados || 0) + (metrics?.estoqueResumo.garrafoesQuebrados || 0)}
              </p>
              <span className="text-[10px] text-rose-700">Avarias sem conserto</span>
            </div>

            <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg">
              <span className="text-xs font-bold text-slate-800">VENCIDOS / DESCARTE</span>
              <p className="text-xl font-bold text-slate-950 mt-1">
                {(metrics?.estoqueResumo.garrafoesVencidos || 0) +
                  (metrics?.estoqueResumo.garrafoesDescartados || 0)}
              </p>
              <span className="text-[10px] text-slate-500">
                {metrics?.estoqueResumo.garrafoesDescartados || 0} já descartados
              </span>
            </div>
          </div>

          {/* Validade Alert */}
          {(metrics?.estoqueResumo.garrafoesProximoVencimento || 0) > 0 && (
            <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Atenção:</strong> {metrics?.estoqueResumo.garrafoesProximoVencimento} garrafões estão próximos ao vencimento da validade de 3 anos.
                </span>
              </div>
              <Link href="/estoque" className="font-bold underline text-amber-950">
                Ver Lotes
              </Link>
            </div>
          )}
        </div>

        {/* Resumo Fiscal de Notas (Spec #9 & #42) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-brand-600" />
                <h3 className="font-bold text-slate-900 text-sm">Resumo Fiscal (NF-e)</h3>
              </div>
              <Link
                href="/notas-fiscais"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                Importar PDF <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Notas Importadas</span>
                <span className="text-sm font-bold text-slate-900">
                  {metrics?.notasFiscaisResumo.quantidadeNotas || 0} documentos
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Valor Total Fiscal</span>
                <span className="text-sm font-bold text-slate-900">
                  {formatCurrency(metrics?.notasFiscaisResumo.valorTotal)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-600 font-medium block">Tributos Destacados</span>
                  <span className="text-[10px] text-slate-400">ICMS + PIS + COFINS</span>
                </div>
                <span className="text-sm font-bold text-brand-700">
                  {formatCurrency(metrics?.notasFiscaisResumo.tributosDestacados)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            * Notas fiscais são para registro e resumo fiscal. Não alteram estoque ou financeiro.
          </div>
        </div>
      </div>
    </div>
  );
}
