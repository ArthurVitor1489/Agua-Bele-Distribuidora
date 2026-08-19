import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        pedidos: {
          orderBy: { data: 'desc' },
          include: {
            itens: {
              include: { produto: true },
            },
            pagamentos: true,
            boletoReceber: {
              include: { parcelas: true },
            },
            fiado: {
              include: { historico: true },
            },
          },
        },
        fiados: {
          orderBy: { createdAt: 'desc' },
          include: {
            pedido: {
              include: { itens: { include: { produto: true } } },
            },
            historico: {
              orderBy: { dataPagamento: 'desc' },
            },
          },
        },
        boletos: {
          orderBy: { createdAt: 'desc' },
          include: {
            pedido: true,
            parcelas: {
              orderBy: { numeroParcela: 'asc' },
            },
          },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Calcular resumo financeiro do cliente
    const totalComprado = cliente.pedidos
      .filter((p) => p.status !== 'CANCELADO')
      .reduce((acc, p) => acc + p.total, 0);

    const totalFiadoAberto = cliente.fiados.reduce((acc, f) => acc + f.saldo, 0);

    const boletosPendentes = cliente.boletos.flatMap((b) =>
      b.parcelas.filter((p) => p.status === 'PENDENTE' || p.status === 'VENCIDA')
    );
    const totalBoletoAberto = boletosPendentes.reduce((acc, p) => acc + p.valor, 0);

    const saldoDevedorTotal = totalFiadoAberto + totalBoletoAberto;

    return NextResponse.json({
      cliente,
      resumo: {
        totalPedidos: cliente.pedidos.length,
        totalComprado,
        totalFiadoAberto,
        totalBoletoAberto,
        saldoDevedorTotal,
      },
      pedidos: cliente.pedidos,
      fiados: cliente.fiados,
      boletos: cliente.boletos,
    });
  } catch (error: any) {
    console.error('Erro ao buscar histórico do cliente:', error);
    return NextResponse.json({ error: error.message || 'Erro ao buscar histórico' }, { status: 500 });
  }
}
