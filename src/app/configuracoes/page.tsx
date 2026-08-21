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
  Lock,
} from 'lucide-react';

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState({
    nomeEmpresa: '',
    cnpj: '',
    inscricaoEstadual: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    chavePix: '',
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
                  value={config.nomeEmpresa || ''}
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
                  placeholder="000.000.000.000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Telefone Principal</label>
                <input
                  type="text"
                  value={config.telefone || ''}
                  onChange={(e) => setConfig({ ...config, telefone: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  placeholder="(00) 00000-0000"
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
                  placeholder="CNPJ, E-mail, Celular ou Chave Aleatória"
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
                  value={config.cidade || ''}
                  onChange={(e) => setConfig({ ...config, cidade: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estado (UF)</label>
                <input
                  type="text"
                  value={config.estado || ''}
                  onChange={(e) => setConfig({ ...config, estado: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg uppercase"
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

      {/* Alteração de Senha de Acesso */}
      <SecaoAlterarSenha />
    </div>
  );
}

function SecaoAlterarSenha() {
  const [novaSenha, setNovaSenha] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSalvando(true);

    try {
      const res = await fetch('/api/auth/senha', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novaSenha }),
      });

      const data = await res.json();
      if (res.ok && data.sucesso) {
        setMsg({ tipo: 'sucesso', texto: 'Senha de acesso atualizada com sucesso!' });
        setNovaSenha('');
      } else {
        setMsg({ tipo: 'erro', texto: data.error || 'Erro ao alterar senha' });
      }
    } catch (e: any) {
      setMsg({ tipo: 'erro', texto: 'Erro de conexão ao alterar senha' });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <Lock className="w-5 h-5 text-brand-600" />
        <h3 className="font-bold text-slate-900 text-sm">Segurança & Senha de Acesso do Sistema</h3>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold ${
            msg.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {msg.texto}
        </div>
      )}

      <form onSubmit={handleAlterarSenha} className="space-y-4 max-w-md">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Nova Senha de Acesso
          </label>
          <input
            type="password"
            required
            minLength={4}
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
            placeholder="Digite a nova senha"
          />
        </div>

        <button
          type="submit"
          disabled={salvando || !novaSenha}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm disabled:opacity-50"
        >
          {salvando ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>Atualizar Senha</span>
        </button>
      </form>
    </div>
  );
}
