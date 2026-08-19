import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'purple'
    | 'neutral';
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  const variantStyles = {
    default: 'bg-brand-50 text-brand-700 border-brand-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {children}
    </span>
  );
}

export function StatusPedidoBadge({ status }: { status: string }) {
  switch (status) {
    case 'PENDENTE':
      return <Badge variant="warning">Pendente</Badge>;
    case 'EM_ANDAMENTO':
      return <Badge variant="info">Em Andamento</Badge>;
    case 'ENTREGUE':
      return <Badge variant="success">Entregue</Badge>;
    case 'CANCELADO':
      return <Badge variant="danger">Cancelado</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export function FormaPagamentoBadge({ forma }: { forma?: string | null }) {
  if (!forma) {
    return <Badge variant="neutral">A Definir</Badge>;
  }
  switch (forma) {
    case 'PIX':
      return <Badge variant="success">PIX</Badge>;
    case 'DINHEIRO':
      return <Badge variant="success">Dinheiro</Badge>;
    case 'DEBITO':
      return <Badge variant="info">Cartão Débito</Badge>;
    case 'CREDITO':
      return <Badge variant="purple">Cartão Crédito</Badge>;
    case 'FIADO':
      return <Badge variant="warning">Fiado</Badge>;
    case 'BOLETO':
      return <Badge variant="default">Boleto</Badge>;
    default:
      return <Badge variant="neutral">{forma}</Badge>;
  }
}
