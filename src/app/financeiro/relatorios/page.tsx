'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';

export default function RelatoriosPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchRelatorios = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/financeiro/faturamento?periodo=mes');
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
    fetchRelatorios();
  }, []);

  const formatCurrency = (val: number = 0) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            Demonstrativo Financeiro & Relatório Mensal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Demonstrativo de Resultado do Exercício (DRE) simplificado para fechamento contábil
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-all"
        >
          <Printer className="w-4 h-4" /> Imprimir Relatório
        </button>
      </div>

      {/* Relatório Imprimível */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-xs space-y-6">
        {/* Cabeçalho do Relatório */}
        <div className="border-b-2 border-brand-600 pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-slate-900">ÁGUA BELLE — DISTRIBUIDORA DE ÁGUA</h1>
            <p className="text-xs text-slate-500">CNPJ: 34.892.120/0001-45 — João Pessoa / PB</p>
            <p className="text-xs font-bold text-brand-700 mt-1 uppercase">
              Demonstrativo Operacional e Financeiro Mensal
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
            <p>Responsável: Financeiro Água Belle</p>
          </div>
        </div>

        {/* DRE Simplificado */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 p-2 rounded">
            Demonstrativo de Fluxo & Margem
          </h3>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between items-center font-bold text-slate-900">
              <span>(+) FATURAMENTO BRUTO TOTAL (Vendas)</span>
              <span>{formatCurrency(data?.indicadores?.faturamentoTotal)}</span>
            </div>

            <div className="py-2.5 flex justify-between items-center text-slate-600 pl-4">
              <span>(-) Valores em Aberto (Fiados e Boletos Pendentes)</span>
              <span className="text-amber-800 font-semibold">
                - {formatCurrency(data?.indicadores?.totalEmAberto)}
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center font-bold text-emerald-800 bg-emerald-50/50 px-2 rounded">
              <span>(=) RECEBIMENTOS EFETIVOS NO PERÍODO (Caixa)</span>
              <span>{formatCurrency(data?.indicadores?.recebimentosTotal)}</span>
            </div>

            <div className="py-2.5 flex justify-between items-center text-rose-700 pl-4">
              <span>(-) DESPESAS OPERACIONAIS TOTAIS (Frota, Manutenção, Contas)</span>
              <span className="font-semibold">- {formatCurrency(data?.indicadores?.despesasTotal)}</span>
            </div>

            <div className="py-3 flex justify-between items-center text-base font-bold text-slate-950 bg-slate-100 p-3 rounded-lg border border-slate-200">
              <span>(=) RESULTADO OPERACIONAL LÍQUIDO</span>
              <span className={data?.indicadores?.resultadoLiquido >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                {formatCurrency(data?.indicadores?.resultadoLiquido)}
              </span>
            </div>
          </div>
        </div>

        {/* Assinatura */}
        <div className="pt-16 border-t border-slate-200 flex justify-between text-xs text-slate-500">
          <div className="w-64 text-center border-t border-slate-400 pt-2">
            Financeiro Água Belle
          </div>
          <div className="w-64 text-center border-t border-slate-400 pt-2">
            Diretoria / Gestão Geral
          </div>
        </div>
      </div>
    </div>
  );
}
