'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Calendar,
  DollarSign,
  FileText,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { BoletoReceberDTO, BoletoParcelaDTO } from '@/types';

export default function BoletosPage() {
  const [boletos, setBoletos] = useState<any[]>([]);
  const [resumo, setResumo] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal de Baixa Manual (Spec #25)
  const [baixaModalOpen, setBaixaModalOpen] = useState(false);
  const [selectedParcela, setSelectedParcela] = useState<any | null>(null);
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().slice(0, 10));
  const [obsBaixa, setObsBaixa] = useState('');

  const fetchBoletos = async () => {
    setLoading(true);
    try {
      let url = `/api/financeiro/boletos?search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBoletos(data.boletos || []);
        setResumo(data.resumo || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoletos();
  }, [search, statusFilter]);

  const handleOpenBaixa = (parcela: any) => {
    setSelectedParcela(parcela);
    setDataPagamento(new Date().toISOString().slice(0, 10));
    setObsBaixa('');
    setBaixaModalOpen(true);
  };

  const handleConfirmarBaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParcela) return;

    try {
      const res = await fetch(`/api/financeiro/boletos/parcelas/${selectedParcela.id}/baixar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataPagamento,
          observacoes: obsBaixa,
        }),
      });

      if (res.ok) {
        setBaixaModalOpen(false);
        fetchBoletos();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao baixar parcela');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatCurrency = (val: number = 0) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-600" />
            Financeiro → Boletos a Receber
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle financeiro de boletos e parcelas emitidas para clientes com baixa manual
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden font-medium text-slate-700"
          >
            <option value="">Todos os Status</option>
            <option value="PENDENTE">Pendentes</option>
            <option value="VENCIDA">Vencidas</option>
            <option value="PAGA">Pagas</option>
          </select>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar boleto ou cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg w-56 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <button
            type="button"
            onClick={fetchBoletos}
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>



      {/* Resumo Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl">
          <span className="text-xs font-bold text-sky-800 uppercase tracking-wider block">
            Total em Aberto
          </span>
          <h3 className="text-2xl font-bold text-sky-950 mt-1">
            {formatCurrency(resumo?.totalEmAberto)}
          </h3>
          <span className="text-[11px] text-sky-700 mt-0.5 block">
            {resumo?.quantidadePendentes || 0} parcelas pendentes
          </span>
        </div>

        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
          <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
            Parcelas Vencidas
          </span>
          <h3 className="text-2xl font-bold text-rose-950 mt-1">
            {formatCurrency(resumo?.totalVencido)}
          </h3>
          <span className="text-[11px] text-rose-700 mt-0.5 block">
            {resumo?.quantidadeVencidas || 0} parcelas aguardando cobrança
          </span>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Total Já Recebido (Baixado)
          </span>
          <h3 className="text-2xl font-bold text-emerald-950 mt-1">
            {formatCurrency(resumo?.totalPago)}
          </h3>
          <span className="text-[11px] text-emerald-700 mt-0.5 block">
            {resumo?.quantidadePagas || 0} parcelas liquidadas
          </span>
        </div>
      </div>

      {/* Boletos Table com Parcelas Expandidas */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 bg-white rounded-xl border border-slate-200 text-center text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
            Carregando boletos...
          </div>
        ) : boletos.length === 0 ? (
          <div className="p-12 bg-white rounded-xl border border-slate-200 text-center text-slate-400">
            Nenhum boleto encontrado.
          </div>
        ) : (
          boletos.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
            >
              {/* Header do Boleto */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-brand-700 text-sm">
                    Boleto Nº {b.numero}
                  </span>
                  <span className="text-xs text-slate-500 ml-2">
                    (Pedido #{b.pedido?.numero} — {b.cliente?.nome})
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-500">
                    {b.quantidadeParcelas} parcela{b.quantidadeParcelas > 1 ? 's' : ''}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    Total: {formatCurrency(b.valorTotal)}
                  </span>
                </div>
              </div>

              {/* Tabela de Parcelas (Spec #24) */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white text-slate-500 border-b border-slate-100 font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Parcela</th>
                      <th className="px-4 py-2.5">Vencimento</th>
                      <th className="px-4 py-2.5">Valor</th>
                      <th className="px-4 py-2.5">Data do Pagamento</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                      <th className="px-4 py-2.5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {b.parcelas.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-2.5 font-bold text-slate-700">
                          {p.numeroParcela}ª Parcela
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-700">
                          {new Date(p.dataVencimento).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">
                          {formatCurrency(p.valor)}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">
                          {p.dataPagamento
                            ? new Date(p.dataPagamento).toLocaleDateString('pt-BR')
                            : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge
                            variant={
                              p.status === 'PAGA'
                                ? 'success'
                                : p.status === 'VENCIDA'
                                ? 'danger'
                                : 'warning'
                            }
                          >
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {p.status !== 'PAGA' && (
                            <button
                              type="button"
                              onClick={() => handleOpenBaixa(p)}
                              className="px-2.5 py-1 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-md transition-colors"
                            >
                              Dar Baixa
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Dar Baixa Manual em Parcela (Spec #25) */}
      <Modal
        isOpen={baixaModalOpen}
        onClose={() => setBaixaModalOpen(false)}
        title="Dar Baixa Manual no Boleto"
        subtitle={`Parcela ${selectedParcela?.numeroParcela} — Valor: ${formatCurrency(selectedParcela?.valor)}`}
        maxWidth="md"
      >
        <form onSubmit={handleConfirmarBaixa} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Data Efetiva do Pagamento *
            </label>
            <input
              type="date"
              required
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações da Baixa
            </label>
            <input
              type="text"
              value={obsBaixa}
              onChange={(e) => setObsBaixa(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
              placeholder="Ex: Identificado no extrato bancário Bradesco"
            />
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
            A parcela será marcada como <strong>PAGA</strong> e o valor de <strong>{formatCurrency(selectedParcela?.valor)}</strong> será creditado imediatamente em Recebimentos.
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setBaixaModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
            >
              Confirmar Baixa
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
