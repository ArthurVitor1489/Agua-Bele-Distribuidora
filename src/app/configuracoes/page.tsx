'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Save,
  Phone,
  MapPin,
  CreditCard,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState({
    nomeEmpresa: 'Água Belle — Distribuidora de Água',
    cnpj: '34.892.120/0001-45',
    inscricaoEstadual: '16.123.456-7',
    telefone: '(83) 98765-4321',
    endereco: 'Rua das Fontes Cristalinas, 250 - Tambauzinho',
    cidade: 'João Pessoa',
    estado: 'PB',
    chavePix: 'financeiro@aguabelle.com.br',
  });
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/configuracoes');
      if (res.ok) {
        const data = await res.json();
        if (data) setConfig(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setSucesso(false);

    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setSucesso(true);
        setTimeout(() => setSucesso(false), 3000);
      } else {
        alert('Erro ao salvar configurações');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-600" />
          Configurações da Empresa
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Informações cadastrais exibidas nos PDFs de pedidos e dados de recebimento via PIX
        </p>
      </div>

      {sucesso && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Configurações salvas com sucesso!</span>
        </div>
      )}

      {/* Form de Configurações */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        {loading ? (
          <div className="text-center py-8 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
            Carregando configurações...
          </div>
        ) : (
          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Empresa / Razão Social
                </label>
                <input
                  type="text"
                  required
                  value={config.nomeEmpresa}
                  onChange={(e) => setConfig({ ...config, nomeEmpresa: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ da Empresa</label>
                <input
                  type="text"
                  value={config.cnpj || ''}
                  onChange={(e) => setConfig({ ...config, cnpj: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Inscrição Estadual (I.E.)</label>
                <input
                  type="text"
                  value={config.inscricaoEstadual || ''}
                  onChange={(e) => setConfig({ ...config, inscricaoEstadual: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  placeholder="Ex: 16.123.456-7 ou Isento"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Telefone Principal</label>
                <input
                  type="text"
                  value={config.telefone || ''}
                  onChange={(e) => setConfig({ ...config, telefone: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chave PIX Oficial (para recebimentos)
                </label>
                <input
                  type="text"
                  value={config.chavePix || ''}
                  onChange={(e) => setConfig({ ...config, chavePix: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-brand-700 font-bold"
                  placeholder="Ex: CNPJ, E-mail, Celular ou Chave Aleatória"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Endereço do Depósito</label>
                <input
                  type="text"
                  value={config.endereco || ''}
                  onChange={(e) => setConfig({ ...config, endereco: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cidade</label>
                <input
                  type="text"
                  value={config.cidade || 'João Pessoa'}
                  onChange={(e) => setConfig({ ...config, cidade: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estado (UF)</label>
                <input
                  type="text"
                  value={config.estado || 'PB'}
                  onChange={(e) => setConfig({ ...config, estado: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={salvando}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm"
              >
                {salvando ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Salvar Configurações</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
