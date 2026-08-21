import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

    const resultado = await prisma.$transaction(async (tx) => {
      const produto = await tx.produto.findUnique({
        where: { id },
      });

      if (!produto) {
        throw new Error('Produto não encontrado');
      }

      // 1. Limpar dependências secundárias (preços especiais de clientes e estoque)
      await tx.clientePrecoProduto.deleteMany({ where: { produtoId: id } });
      await tx.movimentacaoEstoque.deleteMany({ where: { produtoId: id } });
      await tx.estoqueProduto.deleteMany({ where: { produtoId: id } });

      // 2. Verificar se o produto já possui vendas/pedidos vinculados
      const pedidosComProduto = await tx.pedidoItem.count({
        where: { produtoId: id },
      });

      if (pedidosComProduto > 0) {
        // Se o produto já foi vendido em pedidos anteriores, inativa em vez de deletar para manter relatórios históricos íntegros
        await tx.produto.update({
          where: { id },
          data: { ativo: false },
        });
        return { inativado: true, mensagem: 'Produto inativado pois já possui histórico de vendas.' };
      }

      // 3. Se não tiver vendas vinculadas, exclui definitivamente do banco
      await tx.produto.delete({
        where: { id },
      });

      return { excluido: true };
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json({ error: error.message || 'Erro ao excluir produto' }, { status: 500 });
  }
}
