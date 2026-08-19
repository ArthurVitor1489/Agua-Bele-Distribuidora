import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const produto = await prisma.$transaction(async (tx) => {
      const p = await tx.produto.update({
        where: { id },
        data: {
          nome: body.nome?.trim(),
          categoria: body.categoria,
          unidade: body.unidade,
          precoVenda: body.precoVenda !== undefined ? Number(body.precoVenda) : undefined,
          ativo: body.ativo !== undefined ? Boolean(body.ativo) : undefined,
          observacoes: body.observacoes?.trim() || null,
        },
      });

      if (body.quantidadeMinima !== undefined) {
        await tx.estoqueProduto.upsert({
          where: { produtoId: id },
          update: { quantidadeMinima: Number(body.quantidadeMinima) },
          create: {
            produtoId: id,
            quantidadeAtual: 0,
            quantidadeMinima: Number(body.quantidadeMinima),
          },
        });
      }

      return p;
    });

    return NextResponse.json(produto);
  } catch (error: any) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json({ error: error.message || 'Erro ao atualizar produto' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.produto.delete({
      where: { id },
    });

    return NextResponse.json({ sucesso: true });
  } catch (error: any) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json({ error: error.message || 'Erro ao excluir produto' }, { status: 500 });
  }
}
