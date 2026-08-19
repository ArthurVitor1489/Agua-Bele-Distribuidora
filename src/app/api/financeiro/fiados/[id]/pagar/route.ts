import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { valorPago, formaPagamento = 'PIX', observacoes } = body;

    const valor = Number(valorPago);

    if (!valor || valor <= 0) {
      return NextResponse.json({ error: 'Valor de pagamento deve ser maior que zero' }, { status: 400 });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const fiado = await tx.fiado.findUnique({
        where: { id },
        include: { cliente: true },
      });

      if (!fiado) {
        throw new Error('Registro de fiado não encontrado.');
      }

      if (fiado.saldo <= 0) {
        throw new Error('Este fiado já está totalmente quitado.');
      }

      if (valor > fiado.saldo) {
        throw new Error(`O valor informado (R$ ${valor.toFixed(2)}) é maior que o saldo devedor (R$ ${fiado.saldo.toFixed(2)}).`);
      }

      const novoValorPago = Number((fiado.valorPago + valor).toFixed(2));
      const novoSaldo = Number((fiado.saldo - valor).toFixed(2));
      const novaSituacao = novoSaldo === 0 ? 'QUITADO' : 'PARCIAL';

      // 1. Criar item no histórico de quitações
      await tx.fiadoHistorico.create({
        data: {
          fiadoId: id,
          valorPago: valor,
          formaPagamento,
          observacoes: observacoes?.trim() || null,
        },
      });

      // 2. Atualizar saldo do fiado
      const fiadoAtualizado = await tx.fiado.update({
        where: { id },
        data: {
          valorPago: novoValorPago,
          saldo: novoSaldo,
          situacao: novaSituacao,
        },
        include: {
          cliente: true,
          historico: { orderBy: { dataPagamento: 'desc' } },
        },
      });

      return fiadoAtualizado;
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Erro ao registrar pagamento de fiado:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar pagamento' }, { status: 500 });
  }
}
