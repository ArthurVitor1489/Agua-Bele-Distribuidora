'use client';

import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Clock,
  HardDrive,
  FileCheck,
} from 'lucide-react';

export default function BackupPage() {
  const [gerando, setGerando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const handleGerarBackup = async () => {
    setGerando(true);
    setMensagem(null);
    try {
      const response = await fetch('/api/backup/gerar');
      if (!response.ok) throw new Error('Falha ao gerar backup');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Backup_AguaBelle_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setMensagem({
        tipo: 'sucesso',
        texto: 'Backup gerado e baixado com sucesso! Guarde este arquivo em local seguro.',
      });
    } catch (e: any) {
      setMensagem({
        tipo: 'erro',
        texto: e.message || 'Erro ao gerar backup',
      });
    } finally {
      setGerando(false);
    }
  };

  const handleRestaurarBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmou = window.confirm(
      'ATENÇÃO: A restauração irá substituir os dados atuais pelos dados do arquivo de backup selecionado. Deseja prosseguir?'
    );
    if (!confirmou) {
      e.target.value = '';
      return;
    }

    setRestaurando(true);
    setMensagem(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/backup/restaurar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMensagem({
          tipo: 'sucesso',
          texto: 'Banco de dados e arquivos restaurados com sucesso!',
        });
      } else {
        throw new Error(data.error || 'Erro na restauração');
      }
    } catch (err: any) {
      setMensagem({
        tipo: 'erro',
        texto: err.message || 'Erro ao restaurar backup',
      });
    } finally {
      setRestaurando(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-brand-600" />
          Segurança & Backup dos Dados
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Geração manual de cópia de segurança, agendamento automático e restauração integral
        </p>
      </div>

      {/* Feedback Mensagem */}
      {mensagem && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-3 ${
            mensagem.tipo === 'sucesso'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {mensagem.tipo === 'sucesso' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{mensagem.texto}</span>
        </div>
      )}

      {/* Cards de Backup Manual e Restauração (Spec #43 & #44) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Backup Manual */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="p-3 bg-brand-50 rounded-lg w-fit text-brand-600 border border-brand-200">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Fazer Backup Agora (Manual)</h3>
            <p className="text-xs text-slate-500">
              Gera um arquivo JSON completo e estruturado contendo todos os clientes, produtos, pedidos, histórico de estoque de garrafões, lançamentos financeiros (recebimentos, fiados, boletos, despesas) e notas fiscais.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGerarBackup}
            disabled={gerando}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-lg shadow-sm shadow-brand-500/20 transition-all active:scale-[0.98]"
          >
            {gerando ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{gerando ? 'Gerando Arquivo de Backup...' : 'Fazer Backup Agora'}</span>
          </button>
        </div>

        {/* 2. Restauração */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="p-3 bg-amber-50 rounded-lg w-fit text-amber-600 border border-amber-200">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Restauração de Backup</h3>
            <p className="text-xs text-slate-500">
              Restaura integralmente o banco de dados a partir de um arquivo de backup previamente exportado. Todas as tabelas serão restauradas em uma transação atômica segura.
            </p>
          </div>

          <label className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-lg shadow-sm transition-all cursor-pointer">
            {restaurando ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>{restaurando ? 'Restaurando Dados...' : 'Selecionar Arquivo para Restaurar'}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestaurarBackup}
              disabled={restaurando}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Backup Automático Status */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Rotina de Backup Automático</h4>
            <p className="text-xs text-slate-500">
              O sistema salva automaticamente snapshot local diário dos dados para prevenção contra perda de dados.
            </p>
          </div>
        </div>

        <div className="text-right text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" /> Ativo & Protegido
          </span>
        </div>
      </div>
    </div>
  );
}
