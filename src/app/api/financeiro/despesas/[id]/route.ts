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
    const {
      categoria,
      descricao,
      valor,
      data,
      formaPagamento,
      status,
      observacoes,
    } = body;

    const despesaExistente = await prisma.despesa.findUnique({
      where: { id },
      include: { boletoPagar: true },
    });

    if (!despesaExistente) {
      return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const despesaAtualizada = await tx.despesa.update({
        where: { id },
        data: {
          categoria: categoria || despesaExistente.categoria,
          descricao: descricao?.trim() || despesaExistente.descricao,
          valor: valor !== undefined ? Number(valor) : despesaExistente.valor,
          data: data ? new Date(data) : despesaExistente.data,
          formaPagamento: formaPagamento || despesaExistente.formaPagamento,
          status: status || despesaExistente.status,
          observacoes: observacoes !== undefined ? observacoes?.trim() || null : despesaExistente.observacoes,
        },
        include: { boletoPagar: true },
      });

      // Se houver boleto a pagar vinculado, atualiza o status do boleto em sintonia
      if (despesaAtualizada.boletoPagarId) {
        await tx.boletoPagar.update({
          where: { id: despesaAtualizada.boletoPagarId },
          data: {
            status: despesaAtualizada.status === 'PAGA' ? 'PAGO' : 'PENDENTE',
          },
        });
      }

      return despesaAtualizada;
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Erro ao atualizar despesa:', error);
    return NextResponse.json({ error: error.message || 'Erro ao atualizar despesa' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const despesa = await tx.despesa.findUnique({
        where: { id },
      });

      if (!despesa) {
        throw new Error('Despesa não encontrada');
      }

      await tx.despesa.delete({ where: { id } });

      if (despesa.boletoPagarId) {
        await tx.boletoPagar.delete({ where: { id: despesa.boletoPagarId } });
      }
    });

    return NextResponse.json({ sucesso: true });
  } catch (error: any) {
    console.error('Erro ao excluir despesa:', error);
    return NextResponse.json({ error: error.message || 'Erro ao excluir despesa' }, { status: 500 });
  }
}
