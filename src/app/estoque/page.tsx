'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Plus,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Calendar,
  Clock,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  Truck,
  ShieldAlert,
  Search,
  SlidersHorizontal,
  Hourglass,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { EstoqueGarrafaoDTO, StatusGarrafao } from '@/types';

export default function EstoquePage() {
  const [estoqueData, setEstoqueData] = useState<any>(null);
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtro de Histórico
  const [filtroHistorico, setFiltroHistorico] = useState<'TODOS' | 'ENTRADA' | 'SAIDA' | 'DANIFICADO'>('TODOS');
  const [buscaHistorico, setBuscaHistorico] = useState('');

  // Modal 1: Carga / Envase Diário em Lote (ex: Água Belle: 100, Água Sublime: 50)
  const [cargaModalOpen, setCargaModalOpen] = useState(false);
  const [itensCarga, setItensCarga] = useState<{ produtoId: string; nome: string; quantidade: number }[]>([]);
  const [motivoCarga, setMotivoCarga] = useState('Recebimento de carga / Envase diário da fábrica');
  const [atualizarGarrafoesCarga, setAtualizarGarrafoesCarga] = useState(true);
  const [salvandoCarga, setSalvandoCarga] = useState(false);

  // Modal 2: Entrada de Lote Novo de Garrafões (Spec #36)
  const [entradaModalOpen, setEntradaModalOpen] = useState(false);
  const [anoFabricacao, setAnoFabricacao] = useState(new Date().getFullYear());
  const [quantidadeEntrada, setQuantidadeEntrada] = useState(100);
  const [statusEntrada, setStatusEntrada] = useState<StatusGarrafao>('VAZIO');
  const [obsEntrada, setObsEntrada] = useState('');

  // Modal 3: Transferência / Danos / Descarte de Garrafões
  const [movimentarModalOpen, setMovimentarModalOpen] = useState(false);
  const [loteOrigemId, setLoteOrigemId] = useState('');
  const [statusDestino, setStatusDestino] = useState<StatusGarrafao>('CHEIO');
  const [quantidadeMov, setQuantidadeMov] = useState(10);
  const [motivoMov, setMotivoMov] = useState('');

  const fetchEstoque = async () => {
    setLoading(true);
    try {
      const [resEstoque, resMov] = await Promise.all([
        fetch('/api/estoque'),
        fetch('/api/estoque/movimentacoes?limit=50'),
      ]);
      if (resEstoque.ok) {
        const data = await resEstoque.json();
        setEstoqueData(data);
      }
      if (resMov.ok) setMovimentacoes(await resMov.json());
    } catch (e) {
      console.error('Erro ao buscar estoque:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstoque();
  }, []);

  // Abrir modal de Carga / Envase Diário
  const handleOpenCargaModal = () => {
    if (!estoqueData?.produtos || estoqueData.produtos.length === 0) {
      alert('Cadastre os produtos antes de lançar cargas de envase.');
      return;
    }
    const produtosAgua = estoqueData.produtos.map((p: any) => ({
      produtoId: p.id,
      nome: p.nome,
      quantidade: 0,
    }));
    setItensCarga(produtosAgua);
    setMotivoCarga('Recebimento de carga / Envase diário da fábrica');
    setAtualizarGarrafoesCarga(true);
    setCargaModalOpen(true);
  };

  const handleSalvarCarga = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoCarga(true);
    try {
      const res = await fetch('/api/estoque/envase-lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itens: itensCarga,
          motivo: motivoCarga,
          atualizarGarrafoes: atualizarGarrafoesCarga,
        }),
      });

      if (res.ok) {
        setCargaModalOpen(false);
        fetchEstoque();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao lançar carga de envase');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSalvandoCarga(false);
    }
  };

  const handleSalvarEntradaGarrafao = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/estoque/garrafoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anoFabricacao: Number(anoFabricacao),
          anoValidade: Number(anoFabricacao) + 3,
          quantidade: Number(quantidadeEntrada),
          status: statusEntrada,
          observacoes: obsEntrada,
        }),
      });

      if (res.ok) {
        setEntradaModalOpen(false);
        setObsEntrada('');
        fetchEstoque();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao registrar entrada');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSalvarMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/estoque/garrafoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origemId: loteOrigemId,
          statusDestino,
          quantidade: Number(quantidadeMov),
          motivo: motivoMov,
        }),
      });

      if (res.ok) {
        setMovimentarModalOpen(false);
        setMotivoMov('');
        fetchEstoque();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao movimentar garrafões');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const anoAtual = new Date().getFullYear();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CHEIO':
        return <Badge variant="success">CHEIO</Badge>;
      case 'VAZIO':
      case 'DISPONIVEL':
        return <Badge variant="info">VAZIO</Badge>;
      case 'DANIFICADO':
      case 'QUEBRADO':
        return <Badge variant="danger">DANIFICADO</Badge>;
      case 'VENCIDO':
        return <Badge variant="warning">VENCIDO</Badge>;
      case 'DESCARTADO':
        return <Badge variant="neutral">DESCARTADO</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // Cálculos do Balanço Patrimonial dos Garrafões
  const totalGarrafoes = estoqueData?.consolidadoGarrafoes?.totalGeral || 0;
  const qtdCheios = estoqueData?.consolidadoGarrafoes?.CHEIO || 0;
  const qtdVazios = (estoqueData?.consolidadoGarrafoes?.VAZIO || 0) + (estoqueData?.consolidadoGarrafoes?.DISPONIVEL || 0);
  const qtdDanificados = (estoqueData?.consolidadoGarrafoes?.DANIFICADO || 0) + (estoqueData?.consolidadoGarrafoes?.QUEBRADO || 0);
  const qtdVencidos = (estoqueData?.consolidadoGarrafoes?.VENCIDO || 0) + (estoqueData?.consolidadoGarrafoes?.DESCARTADO || 0);

  const pctCheios = totalGarrafoes > 0 ? (qtdCheios / totalGarrafoes) * 100 : 0;
  const pctVazios = totalGarrafoes > 0 ? (qtdVazios / totalGarrafoes) * 100 : 0;
  const pctDanificados = totalGarrafoes > 0 ? (qtdDanificados / totalGarrafoes) * 100 : 0;
  const pctVencidos = totalGarrafoes > 0 ? (qtdVencidos / totalGarrafoes) * 100 : 0;

  // Filtragem de Movimentações
  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes.filter((mov) => {
      if (filtroHistorico !== 'TODOS') {
        if (filtroHistorico === 'DANIFICADO') {
          if (mov.tipo !== 'DANIFICADO' && mov.tipo !== 'QUEBRADO') return false;
        } else if (mov.tipo !== filtroHistorico) {
          return false;
        }
      }
      if (buscaHistorico.trim()) {
        const query = buscaHistorico.toLowerCase();
        const nomeProd = mov.produto?.nome?.toLowerCase() || '';
        const motivo = mov.motivo?.toLowerCase() || '';
        return nomeProd.includes(query) || motivo.includes(query);
      }
      return true;
    });
  }, [movimentacoes, filtroHistorico, buscaHistorico]);

  const totalCargaCalculada = itensCarga.reduce((acc, curr) => acc + (Number(curr.quantidade) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header com Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-brand-600" />
            Controle de Estoque & Vasilhames
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão operacional de produtos acabados, ciclo de envase e balanço patrimonial de garrafões
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Assistente 1: Carga / Envase Diário Multi-Produto */}
          <button
            type="button"
            onClick={handleOpenCargaModal}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm shadow-brand-500/20 transition-all active:scale-[0.98]"
          >
            <Truck className="w-4 h-4" />
            <span>Lançar Carga / Envase Diário</span>
          </button>

          {/* Assistente 2: Triagem de Avarias */}
          <button
            type="button"
            onClick={() => {
              if (estoqueData?.garrafoes?.length > 0) {
                setLoteOrigemId(estoqueData.garrafoes[0].id);
              }
              setMovimentarModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-200 shadow-xs transition-all"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
            <span>Triagem / Avarias</span>
          </button>

          {/* Assistente 3: Entrada de Lote Novo */}
          <button
            type="button"
            onClick={() => setEntradaModalOpen(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-200 shadow-xs transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Lote Garrafões Novos</span>
          </button>
        </div>
      </div>

      {/* 4 Cards Principais de Situações dos Garrafões */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <span className="text-[11px] font-bold text-emerald-800 block uppercase">Cheios (Envase)</span>
          <p className="text-3xl font-extrabold text-emerald-950 mt-1">
            {qtdCheios}
          </p>
          <span className="text-[11px] text-emerald-700 block mt-1">Prontos p/ entrega aos clientes</span>
        </div>

        <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl">
          <span className="text-[11px] font-bold text-sky-800 block uppercase">Vazios (Depósito / Troca)</span>
          <p className="text-3xl font-extrabold text-sky-950 mt-1">
            {qtdVazios}
          </p>
          <span className="text-[11px] text-sky-700 block mt-1">Aguardando envase</span>
        </div>

        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
          <span className="text-[11px] font-bold text-rose-800 block uppercase">Danificados (Avarias)</span>
          <p className="text-3xl font-extrabold text-rose-950 mt-1">
            {qtdDanificados}
          </p>
          <span className="text-[11px] text-rose-700 block mt-1">
            Taxa de avaria: <strong>{estoqueData?.consolidadoGarrafoes?.taxaAvarias || 0}%</strong>
          </span>
        </div>

        <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl">
          <span className="text-[11px] font-bold text-slate-700 block uppercase">Vencidos / Descarte</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">
            {qtdVencidos}
          </p>
          <span className="text-[11px] text-slate-500 block mt-1">
            {estoqueData?.consolidadoGarrafoes?.DESCARTADO || 0} descartados
          </span>
        </div>
      </div>

      {/* Régua de Balanço Patrimonial dos Vasilhames */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Balanço Patrimonial de Vasilhames ({totalGarrafoes} garrafões totais)
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Cheios ({pctCheios.toFixed(0)}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> Vazios ({pctVazios.toFixed(0)}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Avarias ({pctDanificados.toFixed(0)}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" /> Vencidos ({pctVencidos.toFixed(0)}%)
            </span>
          </div>
        </div>

        {/* Barra Visual Segmentada */}
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          {pctCheios > 0 && <div style={{ width: `${pctCheios}%` }} className="bg-emerald-500 h-full transition-all" title={`Cheios: ${pctCheios.toFixed(1)}%`} />}
          {pctVazios > 0 && <div style={{ width: `${pctVazios}%` }} className="bg-sky-500 h-full transition-all" title={`Vazios: ${pctVazios.toFixed(1)}%`} />}
          {pctDanificados > 0 && <div style={{ width: `${pctDanificados}%` }} className="bg-rose-500 h-full transition-all" title={`Avarias: ${pctDanificados.toFixed(1)}%`} />}
          {pctVencidos > 0 && <div style={{ width: `${pctVencidos}%` }} className="bg-slate-400 h-full transition-all" title={`Vencidos: ${pctVencidos.toFixed(1)}%`} />}
        </div>
      </div>

      {/* Grid Principal: Produtos Acabados + Lotes por Validade */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Estoque Detalhado de Produtos Específicos & Autonomia de Vendas */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-brand-600" />
                  Produtos em Depósito
                </h3>
                <p className="text-[11px] text-slate-500">Saldos atuais e previsão de autonomia</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {estoqueData?.produtos?.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Nenhum produto cadastrado no catálogo.
                </div>
              ) : (
                estoqueData?.produtos?.map((p: any) => {
                  const qtd = p.estoque?.quantidadeAtual || 0;
                  const min = p.estoque?.quantidadeMinima || 10;
                  const isBaixo = qtd <= min;
                  const dias = p.diasAutonomia;

                  return (
                    <div
                      key={p.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-lg border border-slate-200/80 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-slate-900 text-xs block truncate" title={p.nome}>
                            {p.nome}
                          </span>
                          <span className="text-[10px] text-slate-500">Mínimo ideal: {min} {p.unidade}</span>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-sm font-extrabold ${
                              isBaixo ? 'text-amber-700' : 'text-emerald-700'
                            }`}
                          >
                            {qtd} <span className="text-[10px] font-normal text-slate-500">{p.unidade}</span>
                          </span>
                        </div>
                      </div>

                      {/* Barra de Autonomia / Previsão de Dias */}
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                        <span className="text-slate-600 flex items-center gap-1">
                          <Hourglass className="w-3 h-3 text-slate-400" />
                          {dias !== null && dias !== undefined ? (
                            <span>Autonomia: <strong>~{dias} dias</strong></span>
                          ) : (
                            <span className="text-slate-400">Sem histórico recente</span>
                          )}
                        </span>

                        {isBaixo ? (
                          <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                            Estoque Baixo
                          </span>
                        ) : (
                          <span className="text-[9px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded font-semibold">
                            Normal
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleOpenCargaModal}
              className="w-full py-2 bg-brand-50 hover:bg-brand-100 text-brand-800 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5 text-brand-600" />
              <span>Lançar Chegada de Carga</span>
            </button>
          </div>
        </div>

        {/* 2. Tabela de Lotes de Garrafões por Ano de Fabricação e Validade (3 Anos) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Lotes de Vasilhames por Ano de Fabricação & Validade
              </h3>
            </div>

            {estoqueData?.consolidadoGarrafoes?.proximoVencimento > 0 && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                {estoqueData.consolidadoGarrafoes.proximoVencimento} lotes a vencer
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="px-3 py-2.5">Fabricação</th>
                  <th className="px-3 py-2.5">Validade (3 anos)</th>
                  <th className="px-3 py-2.5">Quantidade</th>
                  <th className="px-3 py-2.5 text-center">Situação</th>
                  <th className="px-3 py-2.5">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400">
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-brand-600" />
                      Carregando lotes...
                    </td>
                  </tr>
                ) : estoqueData?.garrafoes?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400">
                      Nenhum lote de garrafão cadastrado.
                    </td>
                  </tr>
                ) : (
                  estoqueData?.garrafoes?.map((lote: EstoqueGarrafaoDTO) => {
                    const isVencendo = lote.anoValidade <= anoAtual + 1 && !['VENCIDO', 'DESCARTADO'].includes(lote.status);
                    return (
                      <tr key={lote.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-bold text-slate-900 font-mono">
                          Lote {lote.anoFabricacao}
                        </td>
                        <td className="px-3 py-2.5 font-mono">
                          <span className={isVencendo ? 'text-amber-700 font-bold' : 'text-slate-700'}>
                            {lote.anoValidade}
                          </span>
                          {isVencendo && (
                            <span className="text-[10px] text-amber-600 block">Próximo do vencimento</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-slate-900">
                          {lote.quantidade} un
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {getStatusBadge(lote.status)}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 max-w-xs truncate">
                          {lote.observacoes || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Histórico Recente com Filtros Rápidos & Busca */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Histórico & Auditoria de Movimentações
            </h3>
            <p className="text-xs text-slate-500">Rastreabilidade completa de entradas, envases, saídas e avarias</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Abas de Filtro */}
            <div className="bg-slate-100 p-1 rounded-lg flex items-center text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setFiltroHistorico('TODOS')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filtroHistorico === 'TODOS' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Todas ({movimentacoes.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroHistorico('ENTRADA')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filtroHistorico === 'ENTRADA' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Entradas / Cargas
              </button>
              <button
                type="button"
                onClick={() => setFiltroHistorico('SAIDA')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filtroHistorico === 'SAIDA' ? 'bg-white text-rose-800 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Saídas (Pedidos)
              </button>
              <button
                type="button"
                onClick={() => setFiltroHistorico('DANIFICADO')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filtroHistorico === 'DANIFICADO' ? 'bg-white text-amber-800 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Avarias
              </button>
            </div>

            {/* Input de Busca */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar no histórico..."
                value={buscaHistorico}
                onChange={(e) => setBuscaHistorico(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg w-44 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
              <tr>
                <th className="px-3 py-2">Data / Hora</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Produto / Vasilhame</th>
                <th className="px-3 py-2 text-right">Quantidade</th>
                <th className="px-3 py-2">Motivo / Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movimentacoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-400">
                    Nenhuma movimentação encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                movimentacoesFiltradas.slice(0, 20).map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-500 font-mono">
                      {new Date(mov.data).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={
                          mov.tipo === 'ENTRADA'
                            ? 'success'
                            : mov.tipo === 'SAIDA'
                            ? 'danger'
                            : mov.tipo === 'DANIFICADO' || mov.tipo === 'QUEBRADO'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {mov.tipo}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 font-semibold text-slate-900">
                      {mov.produto?.nome ||
                        mov.pedido?.itens?.map((i: any) => i.produto?.nome).filter(Boolean).join(', ') ||
                        (mov.estoqueGarrafao ? `Garrafões Lote ${mov.estoqueGarrafao.anoFabricacao}` : 'Produto')}
                    </td>
                    <td className="px-3 py-2 font-bold text-slate-900 text-right">
                      {mov.tipo === 'SAIDA' ? `-${mov.quantidade}` : `+${mov.quantidade}`} un
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {mov.motivo || 'Movimentação operacional'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Lançamento de Carga / Envase Diário Multi-Produto                 */}
      {/* ========================================================================= */}
      <Modal
        isOpen={cargaModalOpen}
        onClose={() => setCargaModalOpen(false)}
        title="Lançamento de Carga / Envase Diário"
        subtitle="Informe a quantidade de cada produto recebida no lote do dia"
        maxWidth="lg"
      >
        <form onSubmit={handleSalvarCarga} className="space-y-4">
          <div className="space-y-2 max-h-56 overflow-y-auto p-1 border border-slate-200 rounded-lg bg-slate-50">
            {itensCarga.map((item, index) => (
              <div key={item.produtoId} className="flex items-center justify-between p-2.5 bg-white rounded-md border border-slate-200">
                <span className="font-bold text-slate-900 text-xs">{item.nome}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Quantidade:</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={item.quantidade === 0 ? '' : item.quantidade}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                      const updated = [...itensCarga];
                      updated[index].quantidade = val;
                      setItensCarga(updated);
                    }}
                    className="w-24 text-xs p-1.5 bg-slate-50 border border-slate-200 rounded text-center font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-500"
                  />
                  <span className="text-xs text-slate-500">un</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg flex items-center justify-between text-xs text-brand-950 font-bold">
            <span>Total Geral da Carga:</span>
            <span className="text-base text-brand-700">{totalCargaCalculada} galões</span>
          </div>

          <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg">
            <label className="flex items-start gap-2 cursor-pointer text-xs text-sky-950 font-medium">
              <input
                type="checkbox"
                checked={atualizarGarrafoesCarga}
                onChange={(e) => setAtualizarGarrafoesCarga(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500 mt-0.5"
              />
              <span>
                <strong>Debitar Vasilhames Vazios e Creditar Cheios:</strong> Transfere automaticamente {totalCargaCalculada} garrafões de <em>Vazios</em> para <em>Cheios</em> no lote do ano atual ({anoAtual}).
              </span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações / Motivo
            </label>
            <input
              type="text"
              value={motivoCarga}
              onChange={(e) => setMotivoCarga(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
              placeholder="Ex: Carga recebida da fábrica"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setCargaModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvandoCarga || totalCargaCalculada <= 0}
              className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg shadow-sm flex items-center gap-1.5"
            >
              {salvandoCarga ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Confirmar Carga de {totalCargaCalculada} Galões</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: Entrada de Lote Novo de Garrafões (Spec #36)                      */}
      {/* ========================================================================= */}
      <Modal
        isOpen={entradaModalOpen}
        onClose={() => setEntradaModalOpen(false)}
        title="Entrada de Garrafões Novos do Fabricante"
        subtitle="O controle é por quantidade e lote/ano de fabricação com validade de 3 anos"
        maxWidth="md"
      >
        <form onSubmit={handleSalvarEntradaGarrafao} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ano de Fabricação *
              </label>
              <input
                type="number"
                required
                min={2020}
                max={2035}
                value={anoFabricacao}
                onChange={(e) => setAnoFabricacao(Number(e.target.value))}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Validade (3 anos)
              </label>
              <input
                type="number"
                disabled
                value={anoFabricacao + 3}
                className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantidade *
              </label>
              <input
                type="number"
                required
                min={1}
                value={quantidadeEntrada}
                onChange={(e) => setQuantidadeEntrada(Number(e.target.value))}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Situação Inicial
              </label>
              <select
                value={statusEntrada}
                onChange={(e) => setStatusEntrada(e.target.value as StatusGarrafao)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
              >
                <option value="VAZIO">VAZIO (Pronto p/ envase)</option>
                <option value="CHEIO">CHEIO (Já envasado)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações (Fornecedor / Nota de Compra)
            </label>
            <textarea
              rows={2}
              value={obsEntrada}
              onChange={(e) => setObsEntrada(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
              placeholder="Ex: Compra de 100 garrafões novos da fábrica"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEntradaModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm"
            >
              Confirmar Entrada
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: Movimentação / Triagem / Danos / Descarte de Garrafões             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={movimentarModalOpen}
        onClose={() => setMovimentarModalOpen(false)}
        title="Movimentação & Triagem Operacional de Garrafões"
        subtitle="Transfira quantidades entre situações (Envase, Avarias/Danos, Descarte)"
        maxWidth="md"
      >
        <form onSubmit={handleSalvarMovimentacao} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lote de Origem *
            </label>
            <select
              required
              value={loteOrigemId}
              onChange={(e) => setLoteOrigemId(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              {estoqueData?.garrafoes
                ?.filter((g: any) => g.quantidade > 0)
                ?.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    Lote {l.anoFabricacao} ({l.status}) — {l.quantidade} un disponíveis
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nova Situação (Destino) *
              </label>
              <select
                value={statusDestino}
                onChange={(e) => setStatusDestino(e.target.value as StatusGarrafao)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
              >
                <option value="CHEIO">CHEIO (Envase / Pronto)</option>
                <option value="VAZIO">VAZIO (Devolução / Troca)</option>
                <option value="DANIFICADO">DANIFICADO (Avaria / Quebrado sem conserto)</option>
                <option value="VENCIDO">VENCIDO (Validade Expirada)</option>
                <option value="DESCARTADO">DESCARTADO (Descarte / Reciclagem)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantidade *
              </label>
              <input
                type="number"
                required
                min={1}
                value={quantidadeMov}
                onChange={(e) => setQuantidadeMov(Number(e.target.value))}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Motivo / Justificativa
            </label>
            <input
              type="text"
              value={motivoMov}
              onChange={(e) => setMotivoMov(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
              placeholder="Ex: Envase de lote matutino ou trinca no gargalo"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setMovimentarModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm"
            >
              Confirmar Movimentação
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
