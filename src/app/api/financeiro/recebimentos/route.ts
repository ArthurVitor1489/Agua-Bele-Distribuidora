import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forma = searchParams.get('forma');

    // 1. Pagamentos diretos de pedidos
    const wherePagamentos: any = {};
    if (forma) {
      wherePagamentos.forma = forma;
    }

    const pagamentos = await prisma.pagamento.findMany({
      where: wherePagamentos,
      orderBy: { dataPagamento: 'desc' },
      include: {
        pedido: {
          include: {
            cliente: true,
          },
        },
      },
    });

    // 2. Pagamentos de amortização de fiados
    const whereFiados: any = {};
    if (forma) {
      whereFiados.formaPagamento = forma;
    }

    const historicoFiados = await prisma.fiadoHistorico.findMany({
      where: whereFiados,
      orderBy: { dataPagamento: 'desc' },
      include: {
        fiado: {
          include: {
            cliente: true,
            pedido: true,
          },
        },
      },
    });

    // Consolidar em uma lista unificada de recebimentos efetivos
    const recebimentosConsolidados = [
      ...pagamentos.map((p) => ({
        id: `pag-${p.id}`,
        tipoOrigem: 'PEDIDO_DIRETO',
        pedidoNumero: p.pedido?.numero,
        clienteNome: p.pedido?.cliente?.nome || 'Cliente Balcão',
        clienteTelefone: p.pedido?.cliente?.telefone || p.pedido?.cliente?.whatsapp,
        forma: p.forma,
        valor: p.valor,
        data: p.dataPagamento,
        observacoes: p.observacoes,
      })),
      ...historicoFiados.map((h) => ({
        id: `fia-${h.id}`,
        tipoOrigem: 'QUITACAO_FIADO',
        pedidoNumero: h.fiado?.pedido?.numero,
        clienteNome: h.fiado?.cliente?.nome || 'Cliente',
        clienteTelefone: h.fiado?.cliente?.telefone || h.fiado?.cliente?.whatsapp,
        forma: h.formaPagamento,
        valor: h.valorPago,
        data: h.dataPagamento,
        observacoes: h.observacoes || 'Amortização de fiado em aberto',
      })),
    ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    const totalRecebido = recebimentosConsolidados.reduce((acc, r) => acc + r.valor, 0);

    return NextResponse.json({
      recebimentos: recebimentosConsolidados,
      totalRecebido,
    });
  } catch (error: any) {
    console.error('Erro ao listar recebimentos:', error);
    return NextResponse.json({ error: error.message || 'Erro ao listar recebimentos' }, { status: 500 });
  }
}
