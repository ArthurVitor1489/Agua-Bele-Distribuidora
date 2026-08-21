'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShoppingCart,
  Search,
  Plus,
  FileText,
  Printer,
  Download,
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  RefreshCw,
  Eye,
  Trash2,
  Pencil,
  Boxes,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge, StatusPedidoBadge, FormaPagamentoBadge } from '@/components/ui/Badge';
import { PedidoDTO, ClienteDTO, FormaPagamento, StatusPedido } from '@/types';
import { gerarPdfPedido, baixarPdfPedido, imprimirPdfPedido } from '@/lib/pdf-generator';

function PedidosContent() {
  const searchParams = useSearchParams();
  const initialAction = searchParams.get('action');
  const initialClienteId = searchParams.get('clienteId');

  const [pedidos, setPedidos] = useState<PedidoDTO[]>([]);
  const [clientes, setClientes] = useState<ClienteDTO[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal Novo / Edição de Pedido
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState<PedidoDTO | null>(null);
  const [selectedClienteId, setSelectedClienteId] = useState(initialClienteId || '');
  const [pedidoItens, setPedidoItens] = useState<{ produtoId: string; quantidade: number; valorUnitario: number }[]>([]);
  const [desconto, setDesconto] = useState(0);
  const [acrescimo, setAcrescimo] = useState(0);
  const [observacoes, setObservacoes] = useState('');
  const [salvandoPedido, setSalvandoPedido] = useState(false);

  // Modal Abrir/Processar Pedido e Definir Pagamento (Spec #13 & #14)
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<PedidoDTO | null>(null);
  const [formaEscolhida, setFormaEscolhida] = useState<FormaPagamento>('PIX');
  const [novoStatus, setNovoStatus] = useState<StatusPedido>('EM_ANDAMENTO');

  // Campos para Boleto
  const [numeroBoleto, setNumeroBoleto] = useState('');
  const [quantidadeParcelas, setQuantidadeParcelas] = useState(1);
  const [parcelasData, setParcelasData] = useState<{ numeroParcela: number; valor: number; dataVencimento: string }[]>([]);

  // Carregar lista de pedidos
  const fetchPedidos = async () => {
    setLoading(true);
    try {
      let url = `/api/pedidos?search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPedidos(data);
      }
    } catch (e) {
      console.error('Erro ao buscar pedidos:', e);
    } finally {
      setLoading(false);
    }
  };

  // Carregar Clientes e Produtos para o formulário
  const fetchAuxiliares = async () => {
    try {
      const [resCli, resProd] = await Promise.all([
        fetch('/api/clientes'),
        fetch('/api/produtos'),
      ]);
      if (resCli.ok) {
        const dataCli = await resCli.json();
        setClientes(dataCli);
      }
      if (resProd.ok) {
        const dataProd = await resProd.json();
        setProdutos(dataProd);
      }
    } catch (e) {
      console.error('Erro ao carregar dados auxiliares:', e);
    }
  };

  useEffect(() => {
    fetchPedidos();
    fetchAuxiliares();
  }, [search, statusFilter]);

  // Sincronizar itens iniciais quando a lista de produtos carrega
  useEffect(() => {
    if (produtos.length > 0) {
      setPedidoItens((prev) => {
        const itemValido = prev.length > 0 && produtos.some((p) => p.id === prev[0].produtoId);
        if (!itemValido) {
          return [
            {
              produtoId: produtos[0].id,
              quantidade: 1,
              valorUnitario: produtos[0].precoVenda,
            },
          ];
        }
        return prev;
      });
    }
  }, [produtos]);

  useEffect(() => {
    if (initialAction === 'new') {
      if (initialClienteId) setSelectedClienteId(initialClienteId);
      handleOpenCreate();
    }
  }, [initialAction, initialClienteId, produtos]);

  const handleOpenCreate = () => {
    if (produtos.length === 0) {
      alert('Você precisa cadastrar pelo menos 1 produto no menu "Produtos" antes de criar um pedido.');
      return;
    }
    setEditingPedido(null);
    const clienteInicial = initialClienteId || '';
    setSelectedClienteId(clienteInicial);
    setPedidoItens([
      {
        produtoId: '',
        quantidade: 1,
        valorUnitario: 0,
      },
    ]);
    setDesconto(0);
    setAcrescimo(0);
    setObservacoes('');
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (pedido: PedidoDTO) => {
    setEditingPedido(pedido);
    setSelectedClienteId(pedido.clienteId);
    setPedidoItens(
      pedido.itens?.map((i) => ({
        produtoId: i.produtoId,
        quantidade: i.quantidade,
        valorUnitario: i.valorUnitario,
      })) || []
    );
    setDesconto(pedido.desconto || 0);
    setAcrescimo(pedido.acrescimo || 0);
    setObservacoes(pedido.observacoes || '');
    setCreateModalOpen(true);
  };

  const handleExcluirPedido = async (pedido: PedidoDTO) => {
    const confirmacao = window.confirm(
      `Tem certeza que deseja EXCLUIR o Pedido #${pedido.numero}? Os garrafões deste pedido serão estornados para o estoque.`
    );
    if (!confirmacao) return;

    try {
      const res = await fetch(`/api/pedidos/${pedido.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchPedidos();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao excluir pedido');
      }
    } catch (e) {
      console.error('Erro ao excluir pedido:', e);
    }
  };

  // Cálculos do Novo Pedido
  const calcularSubtotal = () => {
    return pedidoItens.reduce((acc, item) => acc + (item.quantidade || 0) * (item.valorUnitario || 0), 0);
  };

  const calcularTotal = () => {
    return Math.max(0, calcularSubtotal() - Number(desconto || 0) + Number(acrescimo || 0));
  };

  // Lógica de Preço por Cliente
  const getItemPrice = (produtoId: string, clienteId: string) => {
    if (!clienteId || !produtoId) return 0;
    const selectedCliente = clientes.find((c) => c.id === clienteId);
    const esp = selectedCliente?.precosEspeciais?.find((pe: any) => pe.produtoId === produtoId);
    return esp ? esp.preco : 0;
  };

  // Recalcular preços dos itens se o cliente for alterado
  useEffect(() => {
    if (createModalOpen && !editingPedido) {
      setPedidoItens((prev) =>
        prev.map((item) => ({
          ...item,
          valorUnitario: getItemPrice(item.produtoId, selectedClienteId),
        }))
      );
    }
  }, [selectedClienteId]);

  const handleAddItem = () => {
    if (produtos.length === 0) return;
    setPedidoItens([
      ...pedidoItens,
      { produtoId: '', quantidade: 1, valorUnitario: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setPedidoItens(pedidoItens.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...pedidoItens];
    if (field === 'produtoId') {
      const preco = getItemPrice(value, selectedClienteId);
      updated[index] = {
        ...updated[index],
        produtoId: value,
        valorUnitario: preco,
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: Number(value),
      };
    }
    setPedidoItens(updated);
  };

  const handleCriarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClienteId) {
      alert('Selecione um cliente para o pedido.');
      return;
    }

    const itensValidos = pedidoItens.filter((i) => i.produtoId && Number(i.quantidade) > 0);
    if (itensValidos.length === 0) {
      alert('Por favor, selecione pelo menos 1 produto no pedido.');
      return;
    }

    setSalvandoPedido(true);
    try {
      const url = editingPedido ? `/api/pedidos/${editingPedido.id}` : '/api/pedidos';
      const method = editingPedido ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: selectedClienteId,
          itens: itensValidos,
          desconto: Number(desconto),
          acrescimo: Number(acrescimo),
          observacoes,
        }),
      });

      if (res.ok) {
        setCreateModalOpen(false);
        setEditingPedido(null);
        setSelectedClienteId('');
        setObservacoes('');
        setDesconto(0);
        setAcrescimo(0);
        fetchPedidos();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao salvar pedido');
      }
    } catch (e) {
      console.error('Erro:', e);
    } finally {
      setSalvandoPedido(false);
    }
  };

  // Abrir modal de processamento e definição de pagamento (Spec #14)
  const handleAbrirProcessamento = (pedido: PedidoDTO) => {
    setSelectedPedido(pedido);
    setFormaEscolhida(pedido.formaPagamento || 'PIX');
    setNovoStatus(pedido.status);
    setNumeroBoleto(pedido.boletoReceber?.numero || `BOL-${pedido.numero}`);
    setQuantidadeParcelas(pedido.boletoReceber?.quantidadeParcelas || 1);

    // Gerar datas padrão para parcelas
    const valorParcela = Number((pedido.total / (pedido.boletoReceber?.quantidadeParcelas || 1)).toFixed(2));
    const parcelasIniciais = [];
    const qtd = pedido.boletoReceber?.quantidadeParcelas || 1;
    for (let i = 1; i <= qtd; i++) {
      const dt = new Date();
      dt.setDate(dt.getDate() + i * 30);
      parcelasIniciais.push({
        numeroParcela: i,
        valor: valorParcela,
        dataVencimento: dt.toISOString().slice(0, 10),
      });
    }
    setParcelasData(parcelasIniciais);
    setProcessModalOpen(true);
  };

  const handleSalvarProcessamento = async () => {
    if (!selectedPedido) return;

    try {
      // 1. Salvar forma de pagamento
      const resPag = await fetch(`/api/pedidos/${selectedPedido.id}/pagamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formaPagamento: formaEscolhida,
          numeroBoleto: formaEscolhida === 'BOLETO' ? numeroBoleto : undefined,
          quantidadeParcelas: formaEscolhida === 'BOLETO' ? quantidadeParcelas : undefined,
          parcelas: formaEscolhida === 'BOLETO' ? parcelasData : undefined,
        }),
      });

      // 2. Atualizar status se modificado
      if (novoStatus !== selectedPedido.status) {
        await fetch(`/api/pedidos/${selectedPedido.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: novoStatus }),
        });
      }

      if (resPag.ok) {
        setProcessModalOpen(false);
        fetchPedidos();
      } else {
        const err = await resPag.json();
        alert(err.error || 'Erro ao processar pagamento do pedido');
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
            <ShoppingCart className="w-5 h-5 text-brand-600" />
            Pedidos & Entregas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão de vendas, entregas e pagamentos
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden font-medium text-slate-700"
          >
            <option value="">Todos os Status</option>
            <option value="PENDENTE">Pendentes</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="ENTREGUE">Entregues</option>
            <option value="CANCELADO">Cancelados</option>
          </select>

          {/* Busca */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar pedido ou cliente..."
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
            <Plus className="w-4 h-4" /> Novo Pedido
          </button>
        </div>
      </div>

      {/* Pedidos Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Nº Pedido</th>
                <th className="px-4 py-3">Cliente / Contato</th>
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Itens</th>
                <th className="px-4 py-3">Valor Total</th>
                <th className="px-4 py-3 text-center">Pagamento</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Carregando pedidos...
                  </td>
                </tr>
              ) : pedidos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              ) : (
                pedidos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Número */}
                    <td className="px-4 py-3 font-bold text-brand-700 text-sm">
                      #{p.numero}
                    </td>

                    {/* Cliente */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{p.cliente?.nome || 'Balcão'}</div>
                      <span className="text-[11px] text-slate-500 block">
                        {p.cliente?.telefone || p.cliente?.bairro || 'Sem contato'}
                      </span>
                    </td>

                    {/* Data */}
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(p.data).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Itens */}
                    <td className="px-4 py-3 max-w-xs">
                      {p.itens.map((item, idx) => (
                        <div key={idx} className="text-[11px] text-slate-700 truncate">
                          <strong>{item.quantidade}x</strong> {item.produto?.nome || item.produtoNome || 'Água 20L'}
                        </div>
                      ))}
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3 font-bold text-slate-900 text-sm">
                      {formatCurrency(p.total)}
                    </td>

                    {/* Forma de Pagamento */}
                    <td className="px-4 py-3 text-center">
                      <FormaPagamentoBadge forma={p.formaPagamento} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <StatusPedidoBadge status={p.status} />
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Receber / Processar Pagamento (Spec #14) */}
                        <button
                          type="button"
                          onClick={() => handleAbrirProcessamento(p)}
                          className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                          title="Abrir pedido para registrar o pagamento e dar baixa no status"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Receber Pagamento</span>
                        </button>

                        {/* Editar Pedido */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-md transition-colors"
                          title="Editar Pedido"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Excluir Pedido */}
                        <button
                          type="button"
                          onClick={() => handleExcluirPedido(p)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Excluir Pedido (Estorna Estoque)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Gerar PDF do Pedido (Spec #42) */}
                        <button
                          type="button"
                          onClick={() => baixarPdfPedido(p)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="Baixar PDF do Pedido"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => imprimirPdfPedido(p)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="Imprimir Pedido"
                        >
                          <Printer className="w-3.5 h-3.5" />
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

      {/* Modal Criar / Editar Pedido (Spec #13 & #16) */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={editingPedido ? `Editar Pedido #${editingPedido.numero}` : 'Novo Pedido de Água'}
        subtitle={editingPedido ? 'Altere os dados, produtos ou observações do pedido' : 'O estoque é debitado imediatamente na confirmação do pedido'}
        maxWidth="2xl"
      >
        <form onSubmit={handleCriarPedido} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Selecione o Cliente *
            </label>
            <select
              required
              value={selectedClienteId}
              onChange={(e) => setSelectedClienteId(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-800"
            >
              <option value="" disabled={Boolean(selectedClienteId)}>
                {clientes.length === 0 ? 'Nenhum cliente cadastrado' : 'Selecione um cliente cadastrado...'}
              </option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} {c.bairro ? `(${c.bairro})` : ''} - {c.telefone || 'Sem fone'}
                </option>
              ))}
            </select>
          </div>

          {/* Lista de Itens do Pedido */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Itens do Pedido
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Produto
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-lg bg-slate-50/50">
              {pedidoItens.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200"
                >
                  <select
                    required
                    value={item.produtoId}
                    onChange={(e) => handleItemChange(index, 'produtoId', e.target.value)}
                    className="flex-1 text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-800"
                  >
                    <option value="" disabled>Selecione um produto...</option>
                    {produtos.map((prod) => {
                      const preco = selectedClienteId ? getItemPrice(prod.id, selectedClienteId) : 0;
                      return (
                        <option key={prod.id} value={prod.id}>
                          {prod.nome} {preco > 0 ? `(R$ ${preco.toFixed(2)})` : ''}
                        </option>
                      );
                    })}
                  </select>

                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">Qtd:</span>
                    <input
                      type="number"
                      min={1}
                      value={item.quantidade}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                      className="w-16 text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-md text-center font-bold"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400 font-bold">R$:</span>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={item.valorUnitario === 0 ? '' : item.valorUnitario}
                      placeholder="0,00"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleItemChange(index, 'valorUnitario', e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-20 text-xs p-1.5 bg-white border border-slate-300 rounded-md text-right font-bold text-emerald-700 focus:ring-1 focus:ring-emerald-500 shadow-xs"
                    />
                  </div>

                  <span className="text-xs font-bold text-slate-900 w-20 text-right">
                    {formatCurrency(item.quantidade * item.valorUnitario)}
                  </span>

                  {pedidoItens.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Desconto, Acréscimo e Totais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Desconto (R$)</label>
              <input
                type="number"
                step="0.01"
                value={desconto}
                onChange={(e) => setDesconto(Number(e.target.value))}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Acréscimo (R$)</label>
              <input
                type="number"
                step="0.01"
                value={acrescimo}
                onChange={(e) => setAcrescimo(Number(e.target.value))}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2 bg-brand-50 p-2.5 rounded-lg border border-brand-200 flex flex-col justify-center text-right">
              <span className="text-[11px] font-bold text-brand-700 uppercase">Valor Total do Pedido</span>
              <span className="text-xl font-bold text-brand-950">{formatCurrency(calcularTotal())}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações de Entrega
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
              placeholder="Ex: Entregar pela manhã. Portão preto."
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Atenção:</strong> O pedido será criado com status <strong>PENDENTE</strong>. A responsável financeira poderá abrir o pedido posteriormente para definir a forma de pagamento e status de entrega.
            </span>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvandoPedido}
              className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm flex items-center gap-2"
            >
              {salvandoPedido ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{salvandoPedido ? 'Salvando...' : editingPedido ? 'Salvar Alterações no Pedido' : 'Criar Pedido e Movimentar Estoque'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Abrir Pedido & Definir Pagamento (Spec #14 & #18) */}
      <Modal
        isOpen={processModalOpen}
        onClose={() => setProcessModalOpen(false)}
        title={`Receber / Baixa de Pagamento — Pedido #${selectedPedido?.numero}`}
        subtitle={`Cliente: ${selectedPedido?.cliente?.nome || 'Balcão'} — Total: ${formatCurrency(selectedPedido?.total)}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Status Operacional */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Status do Pedido
            </label>
            <select
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value as StatusPedido)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
            >
              <option value="PENDENTE">PENDENTE</option>
              <option value="EM_ANDAMENTO">EM ANDAMENTO (Em Rota / Separação)</option>
              <option value="ENTREGUE">ENTREGUE</option>
              <option value="CANCELADO">CANCELADO (Estorna Estoque)</option>
            </select>
          </div>

          {/* Formas de Pagamento Oficiais (Spec #18) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Selecione a Forma de Pagamento Oficial
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {(['PIX', 'DINHEIRO', 'DEBITO', 'CREDITO', 'FIADO', 'BOLETO'] as FormaPagamento[]).map((forma) => (
                <button
                  key={forma}
                  type="button"
                  onClick={() => setFormaEscolhida(forma)}
                  className={`p-3 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
                    formaEscolhida === forma
                      ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{forma}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Detalhes para BOLETO (Spec #23 & #24) */}
          {formaEscolhida === 'BOLETO' && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="text-xs font-bold text-brand-700 uppercase">
                Configuração do Boleto a Receber
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Número do Boleto</label>
                  <input
                    type="text"
                    value={numeroBoleto}
                    onChange={(e) => setNumeroBoleto(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                    placeholder="Ex: BOL-2026-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Qtd Parcelas</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={quantidadeParcelas}
                    onChange={(e) => {
                      const qtd = Number(e.target.value);
                      setQuantidadeParcelas(qtd);
                      const valorP = Number(((selectedPedido?.total || 0) / qtd).toFixed(2));
                      const parcelas = [];
                      for (let i = 1; i <= qtd; i++) {
                        const dt = new Date();
                        dt.setDate(dt.getDate() + i * 30);
                        parcelas.push({
                          numeroParcela: i,
                          valor: valorP,
                          dataVencimento: dt.toISOString().slice(0, 10),
                        });
                      }
                      setParcelasData(parcelas);
                    }}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {parcelasData.map((parc, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-md border border-slate-200">
                    <span className="font-semibold text-slate-700">Parcela {parc.numeroParcela}</span>
                    <input
                      type="date"
                      value={parc.dataVencimento}
                      onChange={(e) => {
                        const updated = [...parcelasData];
                        updated[idx].dataVencimento = e.target.value;
                        setParcelasData(updated);
                      }}
                      className="text-xs p-1 bg-slate-50 border border-slate-200 rounded-md"
                    />
                    <span className="font-bold text-slate-900">{formatCurrency(parc.valor)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Fiado */}
          {formaEscolhida === 'FIADO' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
              <strong>Regra de Fiado:</strong> O valor total de {formatCurrency(selectedPedido?.total)} ficará registrado como saldo em aberto para o cliente <strong>{selectedPedido?.cliente?.nome}</strong> em Financeiro → Fiados.
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setProcessModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSalvarProcessamento}
              className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm"
            >
              Salvar Pagamento & Status
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function PedidosPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Carregando pedidos...</div>}>
      <PedidosContent />
    </Suspense>
  );
}
