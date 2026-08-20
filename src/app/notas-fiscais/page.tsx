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
  Printer,
  Copy,
  FileSpreadsheet,
  Calendar,
  Building2,
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

  // Fechamento Fiscal para o Contador
  const [contadorModalOpen, setContadorModalOpen] = useState(false);
  const [mesSelecionado, setMesSelecionado] = useState(new Date().toISOString().slice(0, 7));
  const [relatorioContador, setRelatorioContador] = useState<any | null>(null);
  const [loadingRelatorio, setLoadingRelatorio] = useState(false);
  const [copiado, setCopiado] = useState(false);

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

  const fetchRelatorioContador = async (mes: string) => {
    setLoadingRelatorio(true);
    try {
      const res = await fetch(`/api/notas-fiscais/relatorio-contador?mes=${mes}`);
      if (res.ok) {
        const data = await res.json();
        setRelatorioContador(data);
      }
    } catch (e) {
      console.error('Erro ao buscar relatório contábil:', e);
    } finally {
      setLoadingRelatorio(false);
    }
  };

  const handleAbrirModalContador = () => {
    setContadorModalOpen(true);
    fetchRelatorioContador(mesSelecionado);
  };

  const handleCopiarTextoEmail = () => {
    if (!relatorioContador) return;
    const r = relatorioContador.resumo;
    const texto = `Prezada Contabilidade,\n\nSegue o fechamento fiscal das Notas Fiscais referentes ao mês de ${relatorioContador.periodo.mesExtenso} da empresa ${relatorioContador.empresa}:\n\n📊 RESUMO DAS NOTAS FISCAIS:\n• Total de Notas Fiscais: ${r.totalNotas}\n• Valor Total Emitido/Recebido: R$ ${r.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n• Total ICMS Destacado: R$ ${r.totalIcms.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n• Total PIS: R$ ${r.totalPis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n• Total COFINS: R$ ${r.totalCofins.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n• Total Geral de Tributos Destacados: R$ ${r.totalTributos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nOs arquivos detalhados seguem anexados. Qualquer dúvida estamos à disposição!\n\nAtenciosamente,\n${relatorioContador.empresa}`;

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleDownloadCsv = () => {
    window.open(`/api/notas-fiscais/relatorio-contador?mes=${mesSelecionado}&csv=true`, '_blank');
  };

  const handleImprimirRelatorio = () => {
    if (!relatorioContador) return;
    const win = window.open('', '_blank');
    if (!win) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fechamento Fiscal — ${relatorioContador.periodo.mesExtenso}</title>
        <style>
          body { font-family: sans-serif; padding: 25px; color: #1e293b; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          .sub { font-size: 13px; color: #64748b; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
          th { background: #f8fafc; font-weight: bold; }
          .text-right { text-align: right; }
          .summary-box { display: flex; gap: 15px; margin-bottom: 24px; }
          .box { flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #f8fafc; }
          .box-title { font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; }
          .box-val { font-size: 18px; font-weight: bold; margin-top: 4px; color: #0f172a; }
        </style>
      </head>
      <body>
        <h1>${relatorioContador.empresa}</h1>
        <div class="sub">Relatório de Fechamento Fiscal Contábil — Período: ${relatorioContador.periodo.mesExtenso}</div>

        <div class="summary-box">
          <div class="box">
            <div class="box-title">Total de Notas</div>
            <div class="box-val">${relatorioContador.resumo.totalNotas}</div>
          </div>
          <div class="box">
            <div class="box-title">Valor Total Bruto</div>
            <div class="box-val">R$ ${relatorioContador.resumo.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="box">
            <div class="box-title">ICMS Destacado</div>
            <div class="box-val">R$ ${relatorioContador.resumo.totalIcms.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="box">
            <div class="box-title">Total Tributos</div>
            <div class="box-val">R$ ${relatorioContador.resumo.totalTributos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Nº Nota</th>
              <th>Data Emissão</th>
              <th>Emitente / Fornecedor</th>
              <th>CNPJ Emitente</th>
              <th class="text-right">Valor Total</th>
              <th class="text-right">ICMS</th>
              <th class="text-right">PIS/COFINS</th>
            </tr>
          </thead>
          <tbody>
            ${relatorioContador.notas.map((n: any) => `
              <tr>
                <td>${n.numero || 'N/A'}</td>
                <td>${new Date(n.dataEmissao).toLocaleDateString('pt-BR')}</td>
                <td>${n.emitenteNome || '-'}</td>
                <td>${n.emitenteCnpj || '-'}</td>
                <td class="text-right">R$ ${n.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td class="text-right">R$ ${n.icms.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td class="text-right">R$ ${(n.pis + n.cofins).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <script>window.print();</script>
      </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
  };

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

          <button
            type="button"
            onClick={handleAbrirModalContador}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-sm shadow-emerald-500/20 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Pacote do Contador</span>
          </button>

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

      {/* Modal Fechamento Fiscal para o Contador */}
      <Modal
        isOpen={contadorModalOpen}
        onClose={() => setContadorModalOpen(false)}
        title="Fechamento Fiscal & Pacote do Contador"
        subtitle="Relatório consolidado de tributos e notas fiscais para a contabilidade"
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Seletor de Mês */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">Selecione o Mês de Referência:</span>
            </div>
            <input
              type="month"
              value={mesSelecionado}
              onChange={(e) => {
                setMesSelecionado(e.target.value);
                fetchRelatorioContador(e.target.value);
              }}
              className="text-xs font-bold p-1.5 bg-white border border-slate-300 rounded-md text-slate-900 shadow-xs"
            />
          </div>

          {loadingRelatorio ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
              Consolidando impostos e notas do mês...
            </div>
          ) : relatorioContador ? (
            <>
              {/* Cards do Resumo para o Contador */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Qtd de Notas</span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{relatorioContador.resumo.totalNotas}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Valor Bruto Total</span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{formatCurrency(relatorioContador.resumo.valorTotal)}</p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase">ICMS Destacado</span>
                  <p className="text-base font-bold text-emerald-950 mt-0.5">{formatCurrency(relatorioContador.resumo.totalIcms)}</p>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <span className="text-[10px] font-bold text-purple-800 uppercase">PIS + COFINS</span>
                  <p className="text-base font-bold text-purple-950 mt-0.5">{formatCurrency(relatorioContador.resumo.totalPis + relatorioContador.resumo.totalCofins)}</p>
                </div>
              </div>

              {/* Lista resumida das notas do mês */}
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2">Nº Nota</th>
                      <th className="p-2">Data</th>
                      <th className="p-2">Emitente</th>
                      <th className="p-2 text-right">Valor Total</th>
                      <th className="p-2 text-right">ICMS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {relatorioContador.notas.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                          Nenhuma nota fiscal encontrada no mês selecionado.
                        </td>
                      </tr>
                    ) : (
                      relatorioContador.notas.map((n: any) => (
                        <tr key={n.id} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold">{n.numero || 'N/A'}</td>
                          <td className="p-2">{new Date(n.dataEmissao).toLocaleDateString('pt-BR')}</td>
                          <td className="p-2 truncate max-w-[120px]">{n.emitenteNome || '-'}</td>
                          <td className="p-2 text-right font-semibold">{formatCurrency(n.valorTotal)}</td>
                          <td className="p-2 text-right text-emerald-700 font-medium">{formatCurrency(n.icms)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Botões de Ação para Envio à Contabilidade */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleCopiarTextoEmail}
                  className="px-3 py-2 text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {copiado ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                  <span>{copiado ? 'Resumo Copiado!' : 'Copiar Resumo p/ E-mail'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleImprimirRelatorio}
                    className="px-3 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>Imprimir Relatório</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    className="px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Planilha CSV Contador</span>
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
