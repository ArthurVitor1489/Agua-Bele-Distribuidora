'use client';

import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Upload,
  Search,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  DollarSign,
  Building,
  Key,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { NotaFiscalDTO } from '@/types';

export default function NotasFiscaisPage() {
  const [notas, setNotas] = useState<NotaFiscalDTO[]>([]);
  const [resumoFiscal, setResumoFiscal] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Upload & Conferência
  const [uploading, setUploading] = useState(false);
  const [conferenciaModalOpen, setConferenciaModalOpen] = useState(false);
  const [dadosExtraidos, setDadosExtraidos] = useState<any | null>(null);
  const [arquivoUrl, setArquivoUrl] = useState<string | null>(null);
  const [arquivoNome, setArquivoNome] = useState<string>('');

  const fetchNotas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notas-fiscais?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setNotas(data.notas || []);
        setResumoFiscal(data.resumoFiscal || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotas();
  }, [search]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/notas-fiscais/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setDadosExtraidos(data.dados);
        setArquivoUrl(data.arquivoUrl);
        setArquivoNome(data.arquivoNome);
        setConferenciaModalOpen(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao ler arquivo PDF da nota');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSalvarConferencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dadosExtraidos) return;

    try {
      const res = await fetch('/api/notas-fiscais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dadosExtraidos,
          arquivoUrl,
        }),
      });

      if (res.ok) {
        setConferenciaModalOpen(false);
        setDadosExtraidos(null);
        fetchNotas();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao salvar nota fiscal');
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
            <FileCheck2 className="w-5 h-5 text-brand-600" />
            Notas Fiscais & Resumo Fiscal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Importação de PDF de NF-e com leitura de tributos destacados e armazenamento seguro
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por número, emissor ou chave..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg w-64 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <label className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm shadow-brand-500/20 transition-all cursor-pointer">
            {uploading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>{uploading ? 'Lendo PDF...' : 'Importar PDF da NF-e'}</span>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>



      {/* Resumo Fiscal Consolidado (Spec #41 & #42) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Notas Registradas
          </span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">
            {resumoFiscal?.quantidadeNotas || 0}
          </h3>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Documentos fiscais importados</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Valor Total Faturado
          </span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(resumoFiscal?.valorTotalNotas)}
          </h3>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Soma dos valores totais de NF-e</span>
        </div>

        <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl">
          <span className="text-xs font-bold text-brand-800 uppercase tracking-wider block">
            ICMS Destacado
          </span>
          <h3 className="text-2xl font-bold text-brand-950 mt-1">
            {formatCurrency(resumoFiscal?.totalIcms)}
          </h3>
          <span className="text-[11px] text-brand-700 mt-0.5 block">Imposto sobre circulação</span>
        </div>

        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block">
            PIS + COFINS Destacados
          </span>
          <h3 className="text-2xl font-bold text-purple-950 mt-1">
            {formatCurrency((resumoFiscal?.totalPis || 0) + (resumoFiscal?.totalCofins || 0))}
          </h3>
          <span className="text-[11px] text-purple-700 mt-0.5 block">
            PIS: {formatCurrency(resumoFiscal?.totalPis)} | COFINS: {formatCurrency(resumoFiscal?.totalCofins)}
          </span>
        </div>
      </div>

      {/* Tabela de Notas Fiscais */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
              <tr>
                <th className="px-4 py-3">Número / Série</th>
                <th className="px-4 py-3">Data Emissão</th>
                <th className="px-4 py-3">Emitente / Fornecedor</th>
                <th className="px-4 py-3 text-right">Valor Total</th>
                <th className="px-4 py-3 text-right">ICMS Destacado</th>
                <th className="px-4 py-3 text-right">PIS/COFINS</th>
                <th className="px-4 py-3 text-right">Arquivo PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Carregando notas fiscais...
                  </td>
                </tr>
              ) : notas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Nenhuma nota fiscal importada ainda.
                  </td>
                </tr>
              ) : (
                notas.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-bold text-brand-700 block">NF-e Nº {n.numero}</span>
                      <span className="text-[10px] text-slate-400">Série: {n.serie || '1'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono">
                      {new Date(n.dataEmissao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{n.emissorNome}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{n.emissorCnpj}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 text-sm">
                      {formatCurrency(n.valorTotal)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-brand-700">
                      {formatCurrency(n.valorIcms)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-purple-700">
                      {formatCurrency(n.valorPis + n.valorCofins)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {n.arquivoUrl ? (
                        <a
                          href={n.arquivoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 px-2 py-1 rounded"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver PDF
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Conferência de Dados da Nota Fiscal (Spec #39) */}
      <Modal
        isOpen={conferenciaModalOpen}
        onClose={() => setConferenciaModalOpen(false)}
        title="Conferência de Dados da Nota Fiscal (NF-e)"
        subtitle={`Arquivo: ${arquivoNome} — Revise os dados extraídos antes de salvar no sistema`}
        maxWidth="2xl"
      >
        {dadosExtraidos && (
          <form onSubmit={handleSalvarConferencia} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Número da Nota *</label>
                <input
                  type="text"
                  required
                  value={dadosExtraidos.numero}
                  onChange={(e) => setDadosExtraidos({ ...dadosExtraidos, numero: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Série</label>
                <input
                  type="text"
                  value={dadosExtraidos.serie || '1'}
                  onChange={(e) => setDadosExtraidos({ ...dadosExtraidos, serie: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Data de Emissão</label>
                <input
                  type="date"
                  value={dadosExtraidos.dataEmissao ? dadosExtraidos.dataEmissao.slice(0, 10) : ''}
                  onChange={(e) => setDadosExtraidos({ ...dadosExtraidos, dataEmissao: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Razão Social do Emitente *
                </label>
                <input
                  type="text"
                  required
                  value={dadosExtraidos.emissorNome}
                  onChange={(e) => setDadosExtraidos({ ...dadosExtraidos, emissorNome: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ do Emitente *</label>
                <input
                  type="text"
                  required
                  value={dadosExtraidos.emissorCnpj}
                  onChange={(e) => setDadosExtraidos({ ...dadosExtraidos, emissorCnpj: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chave de Acesso (44 dígitos)
              </label>
              <input
                type="text"
                value={dadosExtraidos.chaveAcesso || ''}
                onChange={(e) => setDadosExtraidos({ ...dadosExtraidos, chaveAcesso: e.target.value })}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000"
              />
            </div>

            {/* Valores e Tributos Destacados */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <span className="text-xs font-bold text-brand-700 uppercase block">
                Valores e Tributos Destacados na Nota
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dadosExtraidos.valorTotal}
                    onChange={(e) => setDadosExtraidos({ ...dadosExtraidos, valorTotal: Number(e.target.value) })}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ICMS (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dadosExtraidos.valorIcms}
                    onChange={(e) => setDadosExtraidos({ ...dadosExtraidos, valorIcms: Number(e.target.value) })}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PIS (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dadosExtraidos.valorPis}
                    onChange={(e) => setDadosExtraidos({ ...dadosExtraidos, valorPis: Number(e.target.value) })}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">COFINS (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dadosExtraidos.valorCofins}
                    onChange={(e) => setDadosExtraidos({ ...dadosExtraidos, valorCofins: Number(e.target.value) })}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Observações Fiscais</label>
              <textarea
                rows={2}
                value={dadosExtraidos.observacoes || ''}
                onChange={(e) => setDadosExtraidos({ ...dadosExtraidos, observacoes: e.target.value })}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConferenciaModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm"
              >
                Confirmar & Salvar Nota Fiscal
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
