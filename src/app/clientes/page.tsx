'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Clock,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Badge, StatusPedidoBadge, FormaPagamentoBadge } from '@/components/ui/Badge';
import { ClienteDTO } from '@/types';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal de Criação / Edição
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<ClienteDTO | null>(null);

  // Modal de Histórico 360°
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);
  const [clienteHistorico, setClienteHistorico] = useState<any>(null);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    cpfCnpj: '',
    telefone: '',
    whatsapp: '',
    email: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: 'João Pessoa',
    estado: 'PB',
    pontoReferencia: '',
    observacoes: '',
    ativo: true,
  });

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clientes?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setClientes(data);
      }
    } catch (e) {
      console.error('Erro ao buscar clientes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [search]);

  const handleOpenCreate = () => {
    setEditingCliente(null);
    setFormData({
      nome: '',
      cpfCnpj: '',
      telefone: '',
      whatsapp: '',
      email: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: 'João Pessoa',
      estado: 'PB',
      pontoReferencia: '',
      observacoes: '',
      ativo: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (cli: any) => {
    setEditingCliente(cli);
    setFormData({
      nome: cli.nome || '',
      cpfCnpj: cli.cpfCnpj || '',
      telefone: cli.telefone || '',
      whatsapp: cli.whatsapp || '',
      email: cli.email || '',
      cep: cli.cep || '',
      logradouro: cli.logradouro || '',
      numero: cli.numero || '',
      complemento: cli.complemento || '',
      bairro: cli.bairro || '',
      cidade: cli.cidade || 'João Pessoa',
      estado: cli.estado || 'PB',
      pontoReferencia: cli.pontoReferencia || '',
      observacoes: cli.observacoes || '',
      ativo: cli.ativo ?? true,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCliente ? `/api/clientes/${editingCliente.id}` : '/api/clientes';
      const method = editingCliente ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchClientes();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao salvar cliente');
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    }
  };

  const handleOpenHistorico = async (cli: any) => {
    setLoadingHistorico(true);
    setHistoricoModalOpen(true);
    try {
      const res = await fetch(`/api/clientes/${cli.id}/historico`);
      if (res.ok) {
        const data = await res.json();
        setClienteHistorico(data);
      }
    } catch (e) {
      console.error('Erro ao buscar histórico:', e);
    } finally {
      setLoadingHistorico(false);
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
            <Users className="w-5 h-5 text-brand-600" />
            Clientes Cadastrados
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão de clientes e histórico de compras
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF/CNPJ, telefone ou bairro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg w-72 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm shadow-brand-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Novo Cliente
          </button>
        </div>
      </div>

      {/* Clientes Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Endereço & Entrega</th>
                <th className="px-4 py-3 text-center">Pedidos</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Carregando clientes...
                  </td>
                </tr>
              ) : clientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                clientes.map((cli) => (
                  <tr key={cli.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Nome & Documento */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 text-sm">{cli.nome}</div>
                      {cli.cpfCnpj && (
                        <span className="text-[11px] text-slate-500 block font-mono">
                          {cli.cpfCnpj}
                        </span>
                      )}
                    </td>

                    {/* Contato */}
                    <td className="px-4 py-3 space-y-0.5">
                      {cli.telefone && (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cli.telefone}</span>
                        </div>
                      )}
                      {cli.email && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cli.email}</span>
                        </div>
                      )}
                    </td>

                    {/* Endereço */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-start gap-1.5 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                        <span className="truncate">
                          {cli.logradouro ? `${cli.logradouro}, ${cli.numero || 'S/N'}` : 'Sem endereço'}
                          {cli.bairro ? ` - ${cli.bairro}` : ''}
                        </span>
                      </div>
                      {cli.pontoReferencia && (
                        <span className="text-[10px] text-slate-400 block pl-5 truncate">
                          Ref: {cli.pontoReferencia}
                        </span>
                      )}
                    </td>

                    {/* Pedidos Count */}
                    <td className="px-4 py-3 text-center font-bold text-slate-700">
                      {cli._count?.pedidos || 0}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      {cli.ativo ? (
                        <Badge variant="success">Ativo</Badge>
                      ) : (
                        <Badge variant="neutral">Inativo</Badge>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenHistorico(cli)}
                          className="px-2 py-1 text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-md transition-colors"
                          title="Ver histórico de pedidos e débitos"
                        >
                          Histórico
                        </button>
                        <Link
                          href={`/pedidos?action=new&clienteId=${cli.id}`}
                          className="px-2 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md transition-colors"
                          title="Novo pedido para este cliente"
                        >
                          + Pedido
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cli)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md"
                          title="Editar cadastro"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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

      {/* Modal de Cadastro / Edição de Cliente (Spec #10) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCliente ? 'Editar Cliente' : 'Novo Cadastro de Cliente'}
        subtitle="Preencha os dados de identificação e endereço da Água Belle"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome Completo / Razão Social *
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                placeholder="Ex: Arthur Vitor ou Restaurante Sabor do Mar"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                CPF / CNPJ
              </label>
              <input
                type="text"
                value={formData.cpfCnpj}
                onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                placeholder="000.000.000-00 ou 00.000.000/0001-00"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Telefone Principal
              </label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                placeholder="(83) 98888-7777"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                WhatsApp
              </label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                placeholder="(83) 98888-7777"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                placeholder="contato@empresa.com.br"
              />
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-2">
                Endereço de Entrega
              </h4>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CEP</label>
              <input
                type="text"
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                placeholder="58000-000"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bairro</label>
              <input
                type="text"
                value={formData.bairro}
                onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                placeholder="Ex: Manaíra, Cabo Branco, Tambiá"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Logradouro</label>
              <input
                type="text"
                value={formData.logradouro}
                onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                placeholder="Ex: Av. Epitácio Pessoa ou Rua Principal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Número</label>
              <input
                type="text"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                placeholder="Ex: 1200 ou S/N"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Complemento</label>
              <input
                type="text"
                value={formData.complemento}
                onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                placeholder="Ex: Sala 402, Apto 101, Térreo"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cidade</label>
              <input
                type="text"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estado</label>
              <input
                type="text"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ponto de Referência
              </label>
              <input
                type="text"
                value={formData.pontoReferencia}
                onChange={(e) => setFormData({ ...formData, pontoReferencia: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                placeholder="Ex: Próximo à Praça da Paz / Posto Shell"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observações Operacionais
              </label>
              <textarea
                rows={2}
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                placeholder="Ex: Horário preferencial de entrega das 08h às 11h"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
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
              Salvar Cliente
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Histórico do Cliente (Spec #11) */}
      <Modal
        isOpen={historicoModalOpen}
        onClose={() => setHistoricoModalOpen(false)}
        title={clienteHistorico?.cliente.nome ? `Histórico de ${clienteHistorico.cliente.nome}` : 'Histórico do Cliente'}
        subtitle="Histórico completo de pedidos realizados e histórico financeiro de débitos/pagamentos"
        maxWidth="3xl"
      >
        {loadingHistorico ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
            Carregando histórico...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumo Financeiro do Cliente */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Total Pedidos</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  {clienteHistorico?.resumo.totalPedidos || 0}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Total Comprado</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  {formatCurrency(clienteHistorico?.resumo.totalComprado)}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase">Fiado em Aberto</span>
                <p className="text-lg font-bold text-amber-900 mt-0.5">
                  {formatCurrency(clienteHistorico?.resumo.totalFiadoAberto)}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-rose-700 uppercase">Saldo Devedor Total</span>
                <p className="text-lg font-bold text-rose-900 mt-0.5">
                  {formatCurrency(clienteHistorico?.resumo.saldoDevedorTotal)}
                </p>
              </div>
            </div>

            {/* 1. Histórico de Pedidos (Spec #11) */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-brand-600" />
                Histórico de Pedidos
              </h4>

              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold">
                    <tr>
                      <th className="p-2.5">Nº</th>
                      <th className="p-2.5">Data</th>
                      <th className="p-2.5">Itens / Quantidades</th>
                      <th className="p-2.5">Total</th>
                      <th className="p-2.5">Pagamento</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {clienteHistorico?.pedidos.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-brand-700">#{p.numero}</td>
                        <td className="p-2.5 text-slate-500">
                          {new Date(p.data).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-2.5">
                          {p.itens.map((i: any) => (
                            <div key={i.id} className="text-[11px] text-slate-700">
                              {i.quantidade}x {i.produto?.nome || 'Água 25L'}
                            </div>
                          ))}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">
                          {formatCurrency(p.total)}
                        </td>
                        <td className="p-2.5">
                          <FormaPagamentoBadge forma={p.formaPagamento} />
                        </td>
                        <td className="p-2.5 text-center">
                          <StatusPedidoBadge status={p.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Histórico Financeiro (Fiados e Boletos - Spec #11) */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Histórico Financeiro (Fiados e Boletos)
              </h4>

              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold">
                    <tr>
                      <th className="p-2.5">Origem</th>
                      <th className="p-2.5">Valor Original</th>
                      <th className="p-2.5">Valor Pago</th>
                      <th className="p-2.5">Saldo Devedor</th>
                      <th className="p-2.5 text-center">Situação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {clienteHistorico?.fiados.map((f: any) => (
                      <tr key={f.id} className="hover:bg-slate-50">
                        <td className="p-2.5">
                          <span className="font-bold text-amber-900 block">Fiado Pedido #{f.pedido?.numero}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(f.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-700">{formatCurrency(f.valorOriginal)}</td>
                        <td className="p-2.5 text-emerald-700 font-medium">{formatCurrency(f.valorPago)}</td>
                        <td className="p-2.5 font-bold text-rose-900">{formatCurrency(f.saldo)}</td>
                        <td className="p-2.5 text-center">
                          <Badge variant={f.situacao === 'QUITADO' ? 'success' : 'warning'}>
                            {f.situacao}
                          </Badge>
                        </td>
                      </tr>
                    ))}

                    {clienteHistorico?.boletos.map((b: any) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="p-2.5">
                          <span className="font-bold text-sky-900 block">Boleto #{b.numero}</span>
                          <span className="text-[10px] text-slate-400">
                            Pedido #{b.pedido?.numero} ({b.quantidadeParcelas}x)
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-700">{formatCurrency(b.valorTotal)}</td>
                        <td className="p-2.5 text-emerald-700 font-medium">
                          {formatCurrency(
                            b.parcelas
                              .filter((p: any) => p.status === 'PAGA')
                              .reduce((acc: number, p: any) => acc + p.valor, 0)
                          )}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">
                          {formatCurrency(
                            b.parcelas
                              .filter((p: any) => p.status !== 'PAGA')
                              .reduce((acc: number, p: any) => acc + p.valor, 0)
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <Badge variant="info">
                            {b.parcelas.filter((p: any) => p.status === 'PAGA').length}/{b.quantidadeParcelas} Pagas
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
