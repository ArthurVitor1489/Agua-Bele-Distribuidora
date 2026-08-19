import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const limit = Number(searchParams.get('limit') || 50);

    const where: any = {};
    if (tipo) {
      where.tipo = tipo;
    }

    const movimentacoes = await prisma.movimentacaoEstoque.findMany({
      where,
      orderBy: { data: 'desc' },
      take: limit,
      include: {
        produto: true,
        estoqueGarrafao: true,
        pedido: {
          include: {
            cliente: true,
            itens: {
              include: { produto: true },
            },
          },
        },
      },
    });

    return NextResponse.json(movimentacoes);
  } catch (error: any) {
    console.error('Erro ao listar movimentações:', error);
    return NextResponse.json({ error: error.message || 'Erro ao listar movimentações' }, { status: 500 });
  }
}
