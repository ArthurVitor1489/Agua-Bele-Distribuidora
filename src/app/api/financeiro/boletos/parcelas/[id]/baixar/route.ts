import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { dataPagamento, observacoes } = body;

    const dataPg = dataPagamento ? new Date(dataPagamento) : new Date();

    const resultado = await prisma.$transaction(async (tx) => {
      const parcela = await tx.boletoParcela.findUnique({
        where: { id },
        include: {
          boletoReceber: {
            include: { cliente: true, pedido: true },
          },
        },
      });

      if (!parcela) {
        throw new Error('Parcela de boleto não encontrada.');
      }

      if (parcela.status === 'PAGA') {
        throw new Error('Esta parcela já foi baixada anteriormente.');
      }

      // 1. Atualizar status da parcela para PAGA
      const parcelaAtualizada = await tx.boletoParcela.update({
        where: { id },
        data: {
          status: 'PAGA',
          dataPagamento: dataPg,
        },
      });

      // 2. Registrar o recebimento financeiro efetivo correspondente
      await tx.pagamento.create({
        data: {
          pedidoId: parcela.boletoReceber.pedidoId,
          forma: 'BOLETO',
          valor: parcela.valor,
          dataPagamento: dataPg,
          observacoes: observacoes || `Baixa manual da Parcela ${parcela.numeroParcela}/${parcela.boletoReceber.quantidadeParcelas} (Boleto: ${parcela.boletoReceber.numero})`,
        },
      });

      return parcelaAtualizada;
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Parcela baixada com sucesso!',
      parcela: resultado,
    });
  } catch (error: any) {
    console.error('Erro ao baixar parcela de boleto:', error);
    return NextResponse.json({ error: error.message || 'Erro ao baixar parcela' }, { status: 500 });
  }
}
