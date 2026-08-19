import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FormaPagamento } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      formaPagamento,
      // Se Boleto:
      numeroBoleto,
      quantidadeParcelas = 1,
      parcelas = [],
      // Se Fiado ou Direto:
      observacoes,
    } = body;

    const forma = formaPagamento as FormaPagamento;

    if (!['PIX', 'DINHEIRO', 'DEBITO', 'CREDITO', 'FIADO', 'BOLETO'].includes(forma)) {
      return NextResponse.json({ error: 'Forma de pagamento inválida.' }, { status: 400 });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: { id },
        include: {
          cliente: true,
          pagamentos: true,
          fiado: true,
          boletoReceber: { include: { parcelas: true } },
        },
      });

      if (!pedido) {
        throw new Error('Pedido não encontrado.');
      }

      // Limpar registros financeiros anteriores se houver redefinição
      if (pedido.pagamentos.length > 0) {
        await tx.pagamento.deleteMany({ where: { pedidoId: id } });
      }
      if (pedido.fiado) {
        await tx.fiadoHistorico.deleteMany({ where: { fiadoId: pedido.fiado.id } });
        await tx.fiado.delete({ where: { id: pedido.fiado.id } });
      }
      if (pedido.boletoReceber) {
        await tx.boletoParcela.deleteMany({ where: { boletoReceberId: pedido.boletoReceber.id } });
        await tx.boletoReceber.delete({ where: { id: pedido.boletoReceber.id } });
      }

      // Atualizar forma de pagamento no pedido
      await tx.pedido.update({
        where: { id },
        data: { formaPagamento: forma },
      });

      // 1. Pagamento Imediato (PIX, Dinheiro, Débito, Crédito)
      if (['PIX', 'DINHEIRO', 'DEBITO', 'CREDITO'].includes(forma)) {
        await tx.pagamento.create({
          data: {
            pedidoId: id,
            forma,
            valor: pedido.total,
            observacoes: observacoes || `Pagamento registrado via ${forma}`,
          },
        });
      }

      // 2. Fiado
      else if (forma === 'FIADO') {
        await tx.fiado.create({
          data: {
            pedidoId: id,
            clienteId: pedido.clienteId,
            valorOriginal: pedido.total,
            valorPago: 0,
            saldo: pedido.total,
            situacao: 'ABERTO',
          },
        });
      }

      // 3. Boleto a Receber com Parcelas
      else if (forma === 'BOLETO') {
        const qtdParcelas = Number(quantidadeParcelas) || 1;
        const numBoleto = numeroBoleto?.trim() || `BOL-${pedido.numero}-${Date.now().toString().slice(-4)}`;

        const boletoCriado = await tx.boletoReceber.create({
          data: {
            pedidoId: id,
            clienteId: pedido.clienteId,
            numero: numBoleto,
            quantidadeParcelas: qtdParcelas,
            valorTotal: pedido.total,
          },
        });

        if (Array.isArray(parcelas) && parcelas.length > 0) {
          for (let i = 0; i < parcelas.length; i++) {
            const p = parcelas[i];
            await tx.boletoParcela.create({
              data: {
                boletoReceberId: boletoCriado.id,
                numeroParcela: p.numeroParcela || i + 1,
                valor: Number(p.valor) || Number((pedido.total / qtdParcelas).toFixed(2)),
                dataVencimento: new Date(p.dataVencimento || Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000),
                status: 'PENDENTE',
              },
            });
          }
        } else {
          // Geração padrão de parcelas divididas igualmente com intervalos de 30 dias
          const valorPorParcela = Number((pedido.total / qtdParcelas).toFixed(2));
          for (let i = 1; i <= qtdParcelas; i++) {
            const vencimento = new Date();
            vencimento.setDate(vencimento.getDate() + i * 30);
            await tx.boletoParcela.create({
              data: {
                boletoReceberId: boletoCriado.id,
                numeroParcela: i,
                valor: valorPorParcela,
                dataVencimento: vencimento,
                status: 'PENDENTE',
              },
            });
          }
        }
      }

      return await tx.pedido.findUnique({
        where: { id },
        include: {
          cliente: true,
          pagamentos: true,
          fiado: { include: { historico: true } },
          boletoReceber: { include: { parcelas: true } },
        },
      });
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Erro ao definir forma de pagamento do pedido:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar pagamento' }, { status: 500 });
  }
}
