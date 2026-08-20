'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  Boxes,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    categoria: 'AGUA_25L',
    unidade: 'GL',
    precoVenda: 12.00,
    estoqueInicial: 0,
    quantidadeMinima: 10,
    ativo: true,
    observacoes: '',
  });

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/produtos?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setProdutos(data);
      }
    } catch (e) {
      console.error('Erro ao buscar produtos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, [search]);

  const handleOpenCreate = () => {
    setEditingProduto(null);
    setFormData({
      nome: '',
      categoria: 'AGUA_25L',
      unidade: 'GL',
      precoVenda: 12.00,
      estoqueInicial: 0,
      quantidadeMinima: 10,
      ativo: true,
      observacoes: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (prod: any) => {
    setEditingProduto(prod);
    setFormData({
      nome: prod.nome,
      categoria: prod.categoria,
      unidade: prod.unidade,
      precoVenda: prod.precoVenda,
      estoqueInicial: prod.estoque?.quantidadeAtual || 0,
      quantidadeMinima: prod.estoque?.quantidadeMinima || 10,
      ativo: prod.ativo,
      observacoes: prod.observacoes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduto ? `/api/produtos/${editingProduto.id}` : '/api/produtos';
      const method = editingProduto ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchProdutos();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao salvar produto');
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
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
            <Package className="w-5 h-5 text-brand-600" />
            Produtos & Tabela de Preços
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastro de produtos comercializados pela Água Belle
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg w-56 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm shadow-brand-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Novo Produto
          </button>
        </div>
      </div>

      {/* Produtos Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Unidade</th>
                <th className="px-4 py-3">Preço de Venda</th>
                <th className="px-4 py-3 text-center">Estoque Atual</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Carregando produtos...
                  </td>
                </tr>
              ) : produtos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              ) : (
                produtos.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 text-sm">{prod.nome}</div>
                      {prod.observacoes && (
                        <span className="text-[11px] text-slate-500 block truncate max-w-xs">
                          {prod.observacoes}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral">{prod.categoria}</Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{prod.unidade}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 text-sm">
                      {prod.precoVenda > 0 ? (
                        formatCurrency(prod.precoVenda)
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200 text-[11px]">
                          Definido por Cliente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-bold px-2.5 py-1 rounded-md text-xs ${
                          (prod.estoque?.quantidadeAtual || 0) <= (prod.estoque?.quantidadeMinima || 10)
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {prod.estoque?.quantidadeAtual || 0} {prod.unidade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {prod.ativo ? (
                        <Badge variant="success">Ativo</Badge>
                      ) : (
                        <Badge variant="danger">Inativo</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(prod)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md"
                        title="Editar produto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar / Editar Produto */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduto ? 'Editar Produto' : 'Cadastrar Novo Produto'}
        subtitle="Defina nome, categoria e preço de venda"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Produto *</label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              placeholder="Ex: Água Mineral Galão 25L"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="AGUA_25L">Água 25L</option>
                <option value="GARRAFAO_NOVO">Garrafão Novo (Vasilhame)</option>
                <option value="SUPORTE">Suporte</option>
                <option value="BOMBA">Bomba</option>
                <option value="ACESSORIO">Acessório</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unidade</label>
              <input
                type="text"
                value={formData.unidade}
                onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                placeholder="GL, UN, CX"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Preço Base Padrão (R$) <span className="font-normal text-slate-400">(Opcional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.precoVenda === 0 ? '' : formData.precoVenda}
                onFocus={(e) => e.target.select()}
                placeholder="Definido por Cliente"
                onChange={(e) => setFormData({ ...formData, precoVenda: e.target.value === '' ? 0 : Number(e.target.value) })}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 shadow-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estoque Mínimo</label>
              <input
                type="number"
                value={formData.quantidadeMinima === 0 ? '' : formData.quantidadeMinima}
                onFocus={(e) => e.target.select()}
                placeholder="10"
                onChange={(e) => setFormData({ ...formData, quantidadeMinima: e.target.value === '' ? 0 : Number(e.target.value) })}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 shadow-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {!editingProduto && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estoque Inicial
              </label>
              <input
                type="number"
                value={formData.estoqueInicial === 0 ? '' : formData.estoqueInicial}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                onChange={(e) => setFormData({ ...formData, estoqueInicial: e.target.value === '' ? 0 : Number(e.target.value) })}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 shadow-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Observações</label>
            <textarea
              rows={2}
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
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
              className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm"
            >
              Salvar Produto
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
