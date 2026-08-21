import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        cliente: true,
        itens: {
          include: { produto: true },
        },
        pagamentos: true,
        fiado: {
          include: { historico: true },
        },
        boletoReceber: {
          include: { parcelas: true },
        },
        movimentacoes: true,
      },
    });

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    return NextResponse.json(pedido);
  } catch (error: any) {
    console.error('Erro ao buscar pedido:', error);
    return NextResponse.json({ error: error.message || 'Erro ao buscar pedido' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { clienteId, itens, desconto = 0, acrescimo = 0, observacoes } = body;

    if (!clienteId) {
      return NextResponse.json({ error: 'Cliente é obrigatório' }, { status: 400 });
    }

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({ error: 'Pedido deve conter pelo menos 1 produto' }, { status: 400 });
    }

    const itensValidos = itens.filter((i: any) => i.produtoId && Number(i.quantidade) > 0);

    if (itensValidos.length === 0) {
      return NextResponse.json({ error: 'Selecione produtos válidos no pedido' }, { status: 400 });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const pedidoExistente = await tx.pedido.findUnique({
        where: { id },
        include: { itens: true },
      });

      if (!pedidoExistente) {
        throw new Error('Pedido não encontrado para edição');
      }

      // 1. Estornar estoque dos itens antigos (se o pedido não estava cancelado)
      if (pedidoExistente.status !== 'CANCELADO') {
        for (const itemAntigo of pedidoExistente.itens) {
          const prodEstoque = await tx.estoqueProduto.findUnique({
            where: { produtoId: itemAntigo.produtoId },
          });
          if (prodEstoque) {
            await tx.estoqueProduto.update({
              where: { produtoId: itemAntigo.produtoId },
              data: { quantidadeAtual: prodEstoque.quantidadeAtual + itemAntigo.quantidade },
            });
          }
        }
      }

      // 2. Apagar itens antigos
      await tx.pedidoItem.deleteMany({
        where: { pedidoId: id },
      });

      // 3. Debitar estoque dos novos itens e calcular subtotal
      let subtotal = 0;
      const novosItensParaCriar = [];

      for (const item of itensValidos) {
        const qtd = Number(item.quantidade);
        const valorUnitario = Number(item.valorUnitario || 0);
        const itemSubtotal = qtd * valorUnitario;
        const itemDesconto = Number(item.desconto || 0);
        const itemTotal = Math.max(0, itemSubtotal - itemDesconto);

        subtotal += itemTotal;

        novosItensParaCriar.push({
          produtoId: item.produtoId,
          quantidade: qtd,
          valorUnitario,
          desconto: itemDesconto,
          total: itemTotal,
        });

        if (pedidoExistente.status !== 'CANCELADO') {
          const prodEstoque = await tx.estoqueProduto.findUnique({
            where: { produtoId: item.produtoId },
          });
          if (prodEstoque) {
            const novaQtd = Math.max(0, prodEstoque.quantidadeAtual - qtd);
            await tx.estoqueProduto.update({
              where: { produtoId: item.produtoId },
              data: { quantidadeAtual: novaQtd },
            });
          }
        }
      }

      const totalCalculado = Math.max(0, subtotal - Number(desconto) + Number(acrescimo));

      // 4. Atualizar o Pedido
      const pedidoAtualizado = await tx.pedido.update({
        where: { id },
        data: {
          clienteId,
          subtotal,
          desconto: Number(desconto),
          acrescimo: Number(acrescimo),
          total: totalCalculado,
          observacoes: observacoes?.trim() || null,
          itens: {
            create: novosItensParaCriar,
          },
        },
        include: {
          cliente: true,
          itens: { include: { produto: true } },
        },
      });

      return pedidoAtualizado;
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Erro ao editar pedido:', error);
    return NextResponse.json({ error: error.message || 'Erro ao editar pedido' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: { id },
        include: { itens: true },
      });

      if (!pedido) {
        throw new Error('Pedido não encontrado');
      }

      // 1. Restaurar estoque dos itens se o pedido não estiver cancelado
      if (pedido.status !== 'CANCELADO') {
        for (const item of pedido.itens) {
          const prodEstoque = await tx.estoqueProduto.findUnique({
            where: { produtoId: item.produtoId },
          });
          if (prodEstoque) {
            await tx.estoqueProduto.update({
              where: { produtoId: item.produtoId },
              data: { quantidadeAtual: prodEstoque.quantidadeAtual + item.quantidade },
            });
          }
        }
      }

      // 2. Limpar pagamentos e movimentações vinculadas ao pedido
      await tx.pagamento.deleteMany({ where: { pedidoId: id } });
      await tx.movimentacaoEstoque.deleteMany({ where: { pedidoId: id } });

      // 3. Excluir o Pedido (deleta itens, fiado, historicos e boletos automaticamente por onDelete: Cascade)
      await tx.pedido.delete({
        where: { id },
      });
    });

    return NextResponse.json({ sucesso: true });
  } catch (error: any) {
    console.error('Erro ao excluir pedido:', error);
    return NextResponse.json({ error: error.message || 'Erro ao excluir pedido' }, { status: 500 });
  }
}
