import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { StatusPedido } from '@/types';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const novoStatus = body.status as StatusPedido;

    if (!['PENDENTE', 'EM_ANDAMENTO', 'ENTREGUE', 'CANCELADO'].includes(novoStatus)) {
      return NextResponse.json({ error: 'Status de pedido inválido' }, { status: 400 });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: { id },
        include: {
          itens: { include: { produto: true } },
          fiado: true,
          boletoReceber: { include: { parcelas: true } },
        },
      });

      if (!pedido) {
        throw new Error('Pedido não encontrado.');
      }

      // Se for CANCELAMENTO de um pedido que não estava cancelado, estorna o estoque transacionalmente
      if (novoStatus === 'CANCELADO' && pedido.status !== 'CANCELADO') {
        // 1. Estorna estoque de cada produto
        for (const item of pedido.itens) {
          await tx.estoqueProduto.update({
            where: { produtoId: item.produtoId },
            data: { quantidadeAtual: { increment: item.quantidade } },
          });
        }

        // 2. Estorna movimentação de garrafões de água (devolve cheios, remove vazios)
        const qtdAgua = pedido.itens
          .filter((i) => i.produto.categoria === 'AGUA_20L')
          .reduce((acc, i) => acc + i.quantidade, 0);

        if (qtdAgua > 0) {
          const anoAtual = new Date().getFullYear();
          // Credita nos garrafões cheios
          let loteCheio = await tx.estoqueGarrafao.findFirst({
            where: { status: 'CHEIO', anoFabricacao: anoAtual },
          });
          if (loteCheio) {
            await tx.estoqueGarrafao.update({
              where: { id: loteCheio.id },
              data: { quantidade: { increment: qtdAgua } },
            });
          }

          // Debita dos vazios
          let loteVazio = await tx.estoqueGarrafao.findFirst({
            where: { status: 'VAZIO', anoFabricacao: anoAtual },
          });
          if (loteVazio) {
            await tx.estoqueGarrafao.update({
              where: { id: loteVazio.id },
              data: { quantidade: { decrement: qtdAgua } },
            });
          }

          // Auditoria de cancelamento
          await tx.movimentacaoEstoque.create({
            data: {
              tipo: 'AJUSTE',
              quantidade: qtdAgua,
              motivo: `Estorno de cancelamento do Pedido #${pedido.numero}`,
              pedidoId: pedido.id,
            },
          });
        }

        // 3. Cancela boletos pendentes se houver
        if (pedido.boletoReceber) {
          await tx.boletoParcela.updateMany({
            where: {
              boletoReceberId: pedido.boletoReceber.id,
              status: 'PENDENTE',
            },
            data: { status: 'CANCELADA' },
          });
        }
      }

      // Atualiza o status do pedido
      const pedidoAtualizado = await tx.pedido.update({
        where: { id },
        data: { status: novoStatus },
        include: {
          cliente: true,
          itens: { include: { produto: true } },
          pagamentos: true,
          fiado: true,
          boletoReceber: { include: { parcelas: true } },
        },
      });

      return pedidoAtualizado;
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Erro ao atualizar status do pedido:', error);
    return NextResponse.json({ error: error.message || 'Erro ao atualizar status' }, { status: 500 });
  }
}
