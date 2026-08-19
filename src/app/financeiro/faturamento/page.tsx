'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Receipt,
  AlertCircle,
  CreditCard,
  DollarSign,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  FileSpreadsheet,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';

export default function FaturamentoPage() {
  const [periodo, setPeriodo] = useState<'diario' | '7dias' | 'mes' | 'ano'>('mes');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchFaturamento = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/financeiro/faturamento?periodo=${periodo}`);
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
    fetchFaturamento();
  }, [periodo]);

  const formatCurrency = (val: number = 0) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-600" />
            Financeiro → Faturamento Analítico
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Demonstrativo de faturamento (vendas), recebimentos, valores a receber e margem operacional
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => setPeriodo('diario')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              periodo === 'diario' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Diário
          </button>
          <button
            type="button"
            onClick={() => setPeriodo('7dias')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              periodo === '7dias' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            7 dias
          </button>
          <button
            type="button"
            onClick={() => setPeriodo('mes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              periodo === 'mes' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setPeriodo('ano')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              periodo === 'ano' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Anual
          </button>
          <button
            type="button"
            onClick={fetchFaturamento}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>



      {/* Indicadores Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Faturamento"
          value={formatCurrency(data?.indicadores?.faturamentoTotal)}
          subtitle="Total de pedidos"
          icon={TrendingUp}
          variant="brand"
        />

        <StatCard
          title="Recebimentos"
          value={formatCurrency(data?.indicadores?.recebimentosTotal)}
          subtitle="Efetivamente em caixa"
          icon={Receipt}
          variant="success"
        />

        <StatCard
          title="Em Aberto"
          value={formatCurrency(data?.indicadores?.totalEmAberto)}
          subtitle="Fiados + Boletos"
          icon={AlertCircle}
          variant="warning"
        />

        <StatCard
          title="Despesas"
          value={formatCurrency(data?.indicadores?.despesasTotal)}
          subtitle="Total de gastos"
          icon={CreditCard}
          variant="danger"
        />

        <StatCard
          title="Resultado Líquido"
          value={formatCurrency(data?.indicadores?.resultadoLiquido)}
          subtitle="Recebido - Despesas"
          icon={DollarSign}
          variant={data?.indicadores?.resultadoLiquido >= 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Tabela de Vendas e Faturamento do Período */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Detalhamento de Pedidos Faturados no Período
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            {data?.pedidos?.length || 0} pedidos faturados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white border-b border-slate-200 text-slate-600 font-bold uppercase">
              <tr>
                <th className="px-4 py-2.5">Pedido</th>
                <th className="px-4 py-2.5">Data</th>
                <th className="px-4 py-2.5">Cliente</th>
                <th className="px-4 py-2.5">Produtos</th>
                <th className="px-4 py-2.5">Forma</th>
                <th className="px-4 py-2.5 text-right">Faturamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-brand-600" />
                    Carregando faturamento...
                  </td>
                </tr>
              ) : data?.pedidos?.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-bold text-brand-700">#{p.numero}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {new Date(p.data).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-slate-900">{p.cliente?.nome}</td>
                  <td className="px-4 py-2.5 text-slate-700">
                    {p.itens?.map((i: any) => `${i.quantidade}x ${i.produto?.nome || 'Água'}`).join(', ')}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="neutral">{p.formaPagamento || 'A Definir'}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                    {formatCurrency(p.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
