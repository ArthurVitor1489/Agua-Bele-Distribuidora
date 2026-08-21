'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Search,
  DollarSign,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus,
  ChevronRight,
  Receipt,
  User,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { FiadoDTO, FormaPagamento } from '@/types';

export default function FiadosPage() {
  const [fiados, setFiados] = useState<any[]>([]);
  const [resumo, setResumo] = useState<any>(null);
  const [situacaoFilter, setSituacaoFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal de Quitação / Amortização
  const [pagarModalOpen, setPagarModalOpen] = useState(false);
  const [selectedFiado, setSelectedFiado] = useState<any | null>(null);
  const [valorPago, setValorPago] = useState<number>(0);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX');
  const [observacoes, setObservacoes] = useState('');

  // Modal de Histórico de Quitações
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);
  const [fiadoDetalhe, setFiadoDetalhe] = useState<any | null>(null);

  const fetchFiados = async () => {
    setLoading(true);
    try {
      let url = `/api/financeiro/fiados?search=${encodeURIComponent(search)}`;
      if (situacaoFilter) url += `&situacao=${situacaoFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFiados(data.fiados || []);
        setResumo(data.resumo || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiados();
  }, [search, situacaoFilter]);

  const handleOpenPagar = (fiado: any) => {
    setSelectedFiado(fiado);
    setValorPago(fiado.saldo);
    setFormaPagamento('PIX');
    setObservacoes('');
    setPagarModalOpen(true);
  };

  const handleSalvarPagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiado) return;

    try {
      const res = await fetch(`/api/financeiro/fiados/${selectedFiado.id}/pagar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valorPago: Number(valorPago),
          formaPagamento,
          observacoes,
        }),
      });

      if (res.ok) {
        setPagarModalOpen(false);
        fetchFiados();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao registrar pagamento');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenHistorico = (fiado: any) => {
    setFiadoDetalhe(fiado);
    setHistoricoModalOpen(true);
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
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Financeiro → Fiados em Aberto
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de clientes com saldo devedor, amortizações e histórico de quitação
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={situacaoFilter}
            onChange={(e) => setSituacaoFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden font-medium text-slate-700"
          >
            <option value="">Todas as Situações</option>
            <option value="ABERTO">Em Aberto</option>
            <option value="PARCIAL">Quitado Parcialmente</option>
            <option value="QUITADO">Totalmente Quitado</option>
          </select>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por cliente ou documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg w-56 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <button
            type="button"
            onClick={fetchFiados}
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Resumo de Fiados Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
            Saldo Total em Aberto
          </span>
          <h3 className="text-2xl font-bold text-amber-950 mt-1">
            {formatCurrency(resumo?.totalEmAberto)}
          </h3>
          <span className="text-[11px] text-amber-700 mt-0.5 block">
            {resumo?.quantidadeDevedores || 0} clientes com débito pendente
          </span>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
            Total Original Comprado
          </span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(resumo?.totalOriginal)}
          </h3>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Histórico total de vendas fiadas
          </span>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Total Amortizado / Quitado
          </span>
          <h3 className="text-2xl font-bold text-emerald-950 mt-1">
            {formatCurrency(resumo?.totalPago)}
          </h3>
          <span className="text-[11px] text-emerald-700 mt-0.5 block">
            Entradas já liquidadas
          </span>
        </div>
      </div>

      {/* Fiados Table (Spec #22) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Pedido de Origem</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Valor Original</th>
                <th className="px-4 py-3">Valor Pago</th>
                <th className="px-4 py-3 font-bold text-rose-900">Saldo Devedor</th>
                <th className="px-4 py-3 text-center">Situação</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Carregando fiados...
                  </td>
                </tr>
              ) : fiados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Nenhum fiado registrado.
                  </td>
                </tr>
              ) : (
                fiados.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{f.cliente?.nome}</div>
                      <span className="text-[11px] text-slate-500 block">
                        {f.cliente?.telefone || f.cliente?.bairro || 'Sem telefone'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-brand-700">Pedido #{f.pedido?.numero}</span>
                      <span className="text-[10px] text-slate-400 block">
                        {f.pedido?.itens?.map((i: any) => `${i.quantidade}x ${i.produto?.nome || 'Água'}`).join(', ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(f.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {formatCurrency(f.valorOriginal)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">
                      {formatCurrency(f.valorPago)}
                    </td>
                    <td className="px-4 py-3 font-bold text-rose-950 text-sm">
                      {formatCurrency(f.saldo)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={
                          f.situacao === 'QUITADO'
                            ? 'success'
                            : f.situacao === 'PARCIAL'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {f.situacao}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {f.saldo > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenPagar(f)}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
                          >
                            Dar Baixa
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenHistorico(f)}
                          className="px-2 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                        >
                          Histórico
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Pagamento / Amortização de Fiado (Spec #22) */}
      <Modal
        isOpen={pagarModalOpen}
        onClose={() => setPagarModalOpen(false)}
        title="Amortizar / Quitar Fiado"
        subtitle={`Cliente: ${selectedFiado?.cliente?.nome} — Saldo Devedor: ${formatCurrency(selectedFiado?.saldo)}`}
        maxWidth="md"
      >
        <form onSubmit={handleSalvarPagamento} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Valor do Pagamento (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              min={0.01}
              max={selectedFiado?.saldo || undefined}
              value={valorPago}
              onChange={(e) => setValorPago(Number(e.target.value))}
              className="w-full text-sm font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Informe o valor parcial para amortização ou o saldo total para quitação.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Forma de Recebimento
            </label>
            <select
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
            >
              <option value="PIX">PIX</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="DEBITO">Cartão de Débito</option>
              <option value="CREDITO">Cartão de Crédito</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações do Pagamento
            </label>
            <input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
            Ao salvar, o saldo será atualizado para <strong>{formatCurrency(Math.max(0, (selectedFiado?.saldo || 0) - valorPago))}</strong> e a entrada será registrada em Recebimentos.
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setPagarModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
            >
              Confirmar Pagamento
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Histórico de Quitações do Fiado */}
      <Modal
        isOpen={historicoModalOpen}
        onClose={() => setHistoricoModalOpen(false)}
        title={`Histórico de Pagamentos — ${fiadoDetalhe?.cliente?.nome}`}
        subtitle={`Pedido #${fiadoDetalhe?.pedido?.numero} — Valor Original: ${formatCurrency(fiadoDetalhe?.valorOriginal)}`}
        maxWidth="md"
      >
        <div className="space-y-3">
          {fiadoDetalhe?.historico?.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400">
              Nenhuma amortização registrada ainda para este fiado.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {fiadoDetalhe?.historico?.map((h: any) => (
                <div key={h.id} className="p-3 bg-white flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-emerald-700 block">
                      + {formatCurrency(h.valorPago)} ({h.formaPagamento})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(h.dataPagamento).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <span className="text-slate-500 max-w-xs truncate text-[11px]">
                    {h.observacoes || 'Amortização'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
