import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const categoria = searchParams.get('categoria') || '';
    const ativo = searchParams.get('ativo');

    const where: any = {};

    if (ativo !== null && ativo !== undefined && ativo !== '') {
      where.ativo = ativo === 'true';
    }

    if (categoria) {
      where.categoria = categoria;
    }

    if (search) {
      where.OR = [
        { nome: { contains: search } },
        { observacoes: { contains: search } },
      ];
    }

    const produtos = await prisma.produto.findMany({
      where,
      orderBy: { nome: 'asc' },
      include: {
        estoque: true,
      },
    });

    return NextResponse.json(produtos);
  } catch (error: any) {
    console.error('Erro ao listar produtos:', error);
    return NextResponse.json({ error: error.message || 'Erro ao listar produtos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.nome || body.nome.trim() === '') {
      return NextResponse.json({ error: 'Nome do produto é obrigatório' }, { status: 400 });
    }

    const precoVenda = Number(body.precoVenda || 0);
    const estoqueInicial = Number(body.estoqueInicial || 0);
    const quantidadeMinima = Number(body.quantidadeMinima || 10);

    const produto = await prisma.$transaction(async (tx) => {
      const p = await tx.produto.create({
        data: {
          nome: body.nome.trim(),
          categoria: body.categoria || 'AGUA_25L',
          unidade: body.unidade || 'UN',
          precoVenda,
          ativo: body.ativo !== undefined ? Boolean(body.ativo) : true,
          observacoes: body.observacoes?.trim() || null,
        },
      });

      await tx.estoqueProduto.create({
        data: {
          produtoId: p.id,
          quantidadeAtual: estoqueInicial,
          quantidadeMinima,
        },
      });

      if (estoqueInicial > 0) {
        await tx.movimentacaoEstoque.create({
          data: {
            tipo: 'ENTRADA',
            quantidade: estoqueInicial,
            produtoId: p.id,
            motivo: 'Estoque inicial de cadastro do produto',
          },
        });
      }

      return p;
    });

    return NextResponse.json(produto, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json({ error: error.message || 'Erro ao criar produto' }, { status: 500 });
  }
}
