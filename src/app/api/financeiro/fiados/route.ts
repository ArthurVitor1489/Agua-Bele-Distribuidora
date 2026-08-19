import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const situacao = searchParams.get('situacao'); // ABERTO, PARCIAL, QUITADO
    const search = searchParams.get('search')?.trim() || '';

    const where: any = {};

    if (situacao) {
      where.situacao = situacao;
    }

    if (search) {
      where.cliente = {
        OR: [
          { nome: { contains: search } },
          { cpfCnpj: { contains: search } },
          { telefone: { contains: search } },
        ],
      };
    }

    const fiados = await prisma.fiado.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: true,
        pedido: {
          include: {
            itens: { include: { produto: true } },
          },
        },
        historico: {
          orderBy: { dataPagamento: 'desc' },
        },
      },
    });

    const totalEmAberto = fiados
      .filter((f) => f.situacao !== 'QUITADO')
      .reduce((acc, f) => acc + f.saldo, 0);

    const totalOriginal = fiados.reduce((acc, f) => acc + f.valorOriginal, 0);
    const totalPago = fiados.reduce((acc, f) => acc + f.valorPago, 0);

    return NextResponse.json({
      fiados,
      resumo: {
        totalEmAberto,
        totalOriginal,
        totalPago,
        quantidadeDevedores: fiados.filter((f) => f.saldo > 0).length,
      },
    });
  } catch (error: any) {
    console.error('Erro ao listar fiados:', error);
    return NextResponse.json({ error: error.message || 'Erro ao listar fiados' }, { status: 500 });
  }
}
