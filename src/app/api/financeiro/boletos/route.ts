import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PENDENTE, VENCIDA, PAGA, CANCELADA
    const search = searchParams.get('search')?.trim() || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { numero: { contains: search } },
        { cliente: { nome: { contains: search } } },
        { cliente: { cpfCnpj: { contains: search } } },
      ];
    }

    const boletos = await prisma.boletoReceber.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: true,
        pedido: true,
        parcelas: {
          orderBy: { numeroParcela: 'asc' },
        },
      },
    });

    const now = new Date();

    // Atualizar dinamicamente status para VENCIDA se passar da data e estiver pendente
    const boletosComStatusAtualizado = boletos.map((b) => {
      const parcelas = b.parcelas.map((p) => {
        let st = p.status;
        if (st === 'PENDENTE' && new Date(p.dataVencimento) < now) {
          st = 'VENCIDA';
        }
        return {
          ...p,
          status: st,
        };
      });

      return {
        ...b,
        parcelas,
      };
    });

    // Filtrar por status se especificado
    let resultado = boletosComStatusAtualizado;
    if (status) {
      resultado = boletosComStatusAtualizado.filter((b) =>
        b.parcelas.some((p) => p.status === status)
      );
    }

    // Totais e resumos
    const todasParcelas = boletosComStatusAtualizado.flatMap((b) => b.parcelas);
    const totalPendente = todasParcelas
      .filter((p) => p.status === 'PENDENTE')
      .reduce((acc, p) => acc + p.valor, 0);

    const totalVencido = todasParcelas
      .filter((p) => p.status === 'VENCIDA')
      .reduce((acc, p) => acc + p.valor, 0);

    const totalPago = todasParcelas
      .filter((p) => p.status === 'PAGA')
      .reduce((acc, p) => acc + p.valor, 0);

    return NextResponse.json({
      boletos: resultado,
      resumo: {
        totalPendente,
        totalVencido,
        totalPago,
        totalEmAberto: totalPendente + totalVencido,
        quantidadePendentes: todasParcelas.filter((p) => p.status === 'PENDENTE').length,
        quantidadeVencidas: todasParcelas.filter((p) => p.status === 'VENCIDA').length,
        quantidadePagas: todasParcelas.filter((p) => p.status === 'PAGA').length,
      },
    });
  } catch (error: any) {
    console.error('Erro ao listar boletos:', error);
    return NextResponse.json({ error: error.message || 'Erro ao listar boletos' }, { status: 500 });
  }
}
