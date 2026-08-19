'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  DollarSign,
  Calendar,
  CreditCard,
  Truck,
  Wrench,
  Building,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { CategoriaDespesa, FormaPagamento } from '@/types';

export default function DespesasPage() {
  const [despesas, setDespesas] = useState<any[]>([]);
  const [resumo, setResumo] = useState<any>(null);
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal Nova Despesa
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    categoria: 'COMBUSTIVEL' as CategoriaDespesa,
    descricao: '',
    valor: 0,
    data: new Date().toISOString().slice(0, 10),
    formaPagamento: 'PIX' as FormaPagamento,
    status: 'PAGA',
    observacoes: '',
    isBoletoPagar: false,
    fornecedorBoleto: '',
    numeroBoleto: '',
    vencimentoBoleto: '',
  });

  const fetchDespesas = async () => {
    setLoading(true);
    try {
      let url = '/api/financeiro/despesas';
      if (categoriaFilter) url += `?categoria=${categoriaFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDespesas(data.despesas || []);
        setResumo(data.resumo || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDespesas();
  }, [categoriaFilter]);

  const handleSalvarDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        categoria: formData.categoria,
        descricao: formData.descricao,
        valor: Number(formData.valor),
        data: formData.data,
        formaPagamento: formData.formaPagamento,
        status: formData.status,
        observacoes: formData.observacoes,
      };

      if (formData.isBoletoPagar && formData.fornecedorBoleto) {
        payload.boletoPagar = {
          fornecedor: formData.fornecedorBoleto,
          numero: formData.numeroBoleto,
          dataVencimento: formData.vencimentoBoleto || formData.data,
        };
      }

      const res = await fetch('/api/financeiro/despesas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalOpen(false);
        setFormData({
          categoria: 'COMBUSTIVEL',
          descricao: '',
          valor: 0,
          data: new Date().toISOString().slice(0, 10),
          formaPagamento: 'PIX',
          status: 'PAGA',
          observacoes: '',
          isBoletoPagar: false,
          fornecedorBoleto: '',
          numeroBoleto: '',
          vencimentoBoleto: '',
        });
        fetchDespesas();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao lançar despesa');
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
            <FileText className="w-5 h-5 text-rose-600" />
            Financeiro → Despesas Operacionais
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle de gastos com frota, manutenção, insumos e boletos de fornecedores a pagar
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden font-medium text-slate-700"
          >
            <option value="">Todas as Categorias</option>
            <option value="COMBUSTIVEL">Combustível</option>
            <option value="MANUTENCAO">Manutenção de Veículos</option>
            <option value="FORNECEDOR">Fornecedores / Insumos</option>
            <option value="PESSOAL">Pessoal / Folha</option>
            <option value="CONTAS_FIXAS">Contas Fixas (Luz, Água)</option>
            <option value="IMPOSTOS">Impostos / Taxas</option>
            <option value="OUTROS">Outros</option>
          </select>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm shadow-rose-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Nova Despesa
          </button>
        </div>
      </div>

      {/* Resumo Despesas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
          <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
            Total de Despesas
          </span>
          <h3 className="text-2xl font-bold text-rose-950 mt-1">
            {formatCurrency(resumo?.totalDespesas)}
          </h3>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
            Despesas Pagas (Liquidadas)
          </span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(resumo?.totalPagas)}
          </h3>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
            Despesas a Pagar (Pendentes)
          </span>
          <h3 className="text-2xl font-bold text-amber-950 mt-1">
            {formatCurrency(resumo?.totalPendentes)}
          </h3>
        </div>
      </div>

      {/* Tabela de Despesas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Descrição da Despesa</th>
                <th className="px-4 py-3">Forma Pagto</th>
                <th className="px-4 py-3 text-right font-bold text-rose-900">Valor (R$)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Carregando despesas...
                  </td>
                </tr>
              ) : despesas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Nenhuma despesa registrada.
                  </td>
                </tr>
              ) : (
                despesas.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600 font-mono">
                      {new Date(d.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral">{d.categoria}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{d.descricao}</span>
                      {d.boletoPagar && (
                        <span className="text-[10px] text-sky-700 font-semibold block">
                          Boleto Fornecedor: {d.boletoPagar.fornecedor} (#{d.boletoPagar.numero})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{d.formaPagamento}</td>
                    <td className="px-4 py-3 text-right font-bold text-rose-950 text-sm">
                      {formatCurrency(d.valor)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={d.status === 'PAGA' ? 'success' : 'warning'}>
                        {d.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                      {d.observacoes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Despesa (Spec #26 & #27) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Lançamento de Despesa Operacional"
        subtitle="Registre gastos da Água Belle ou boletos de fornecedores a pagar"
        maxWidth="md"
      >
        <form onSubmit={handleSalvarDespesa} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Descrição do Gasto *</label>
            <input
              type="text"
              required
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              placeholder="Ex: Abastecimento caminhão diesel S10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value as CategoriaDespesa })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="COMBUSTIVEL">Combustível</option>
                <option value="MANUTENCAO">Manutenção de Veículos</option>
                <option value="FORNECEDOR">Fornecedores / Insumos</option>
                <option value="PESSOAL">Pessoal / Diárias</option>
                <option value="CONTAS_FIXAS">Contas Fixas (Energia, Água)</option>
                <option value="IMPOSTOS">Impostos / Taxas</option>
                <option value="OUTROS">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                required
                min={0.01}
                placeholder="0,00"
                value={formData.valor === 0 ? '' : formData.valor}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                  setFormData({ ...formData, valor: val });
                }}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Data</label>
              <input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Forma</label>
              <select
                value={formData.formaPagamento}
                onChange={(e) => setFormData({ ...formData, formaPagamento: e.target.value as FormaPagamento })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="PIX">PIX</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="DEBITO">Débito</option>
                <option value="CREDITO">Crédito</option>
                <option value="BOLETO">Boleto a Pagar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
              >
                <option value="PAGA">PAGA</option>
                <option value="PENDENTE">PENDENTE</option>
              </select>
            </div>
          </div>

          {/* Opção Boleto a Pagar Fornecedor (Spec #27) */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={formData.isBoletoPagar}
                onChange={(e) => setFormData({ ...formData, isBoletoPagar: e.target.checked })}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Vincular como Boleto a Pagar (Fornecedor)</span>
            </label>

            {formData.isBoletoPagar && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nome do Fornecedor *
                  </label>
                  <input
                    type="text"
                    value={formData.fornecedorBoleto}
                    onChange={(e) => setFormData({ ...formData, fornecedorBoleto: e.target.value })}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                    placeholder="Ex: Petrobras Distribuidora ou Fábrica de Tampas"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Nº do Boleto
                    </label>
                    <input
                      type="text"
                      value={formData.numeroBoleto}
                      onChange={(e) => setFormData({ ...formData, numeroBoleto: e.target.value })}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                      placeholder="Ex: BOL-FORN-902"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Vencimento
                    </label>
                    <input
                      type="date"
                      value={formData.vencimentoBoleto}
                      onChange={(e) => setFormData({ ...formData, vencimentoBoleto: e.target.value })}
                      className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Observações</label>
            <textarea
              rows={2}
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"
            >
              Salvar Despesa
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
