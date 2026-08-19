'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  Filter,
  RefreshCw,
  ArrowUpRight,
} from 'lucide-react';
import { Badge, FormaPagamentoBadge } from '@/components/ui/Badge';

export default function RecebimentosPage() {
  const [recebimentos, setRecebimentos] = useState<any[]>([]);
  const [totalRecebido, setTotalRecebido] = useState(0);
  const [formaFilter, setFormaFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRecebimentos = async () => {
    setLoading(true);
    try {
      let url = '/api/financeiro/recebimentos';
      if (formaFilter) url += `?forma=${formaFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecebimentos(data.recebimentos || []);
        setTotalRecebido(data.totalRecebido || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecebimentos();
  }, [formaFilter]);

  const formatCurrency = (val: number = 0) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            Financeiro → Recebimentos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Valores efetivamente liquidados e recebidos no caixa da Água Belle
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={formaFilter}
            onChange={(e) => setFormaFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden font-medium text-slate-700"
          >
            <option value="">Todas as Formas</option>
            <option value="PIX">PIX</option>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="DEBITO">Débito</option>
            <option value="CREDITO">Crédito</option>
            <option value="BOLETO">Boleto Pago</option>
          </select>

          <button
            type="button"
            onClick={fetchRecebimentos}
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Total Card Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Total Efetivamente Recebido
          </span>
          <h3 className="text-2xl font-bold text-emerald-950 mt-1">
            {formatCurrency(totalRecebido)}
          </h3>
        </div>
        <div className="text-right text-xs text-emerald-700 font-medium">
          {recebimentos.length} transações registradas
        </div>
      </div>

      {/* Recebimentos Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
              <tr>
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3 text-center">Forma</th>
                <th className="px-4 py-3 text-right">Valor Recebido</th>
                <th className="px-4 py-3">Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Carregando recebimentos...
                  </td>
                </tr>
              ) : recebimentos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Nenhum recebimento encontrado.
                  </td>
                </tr>
              ) : (
                recebimentos.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(r.data).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {r.pedidoNumero ? (
                        <span className="font-bold text-brand-700">Pedido #{r.pedidoNumero}</span>
                      ) : (
                        <span className="font-semibold text-slate-700">Avulso</span>
                      )}
                      <span className="text-[10px] text-slate-400 block">
                        {r.tipoOrigem === 'QUITACAO_FIADO' ? 'Quitação de Fiado' : 'Recebimento Direto'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{r.clienteNome}</td>
                    <td className="px-4 py-3 text-center">
                      <FormaPagamentoBadge forma={r.forma} />
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-950 text-sm">
                      {formatCurrency(r.valor)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                      {r.observacoes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
