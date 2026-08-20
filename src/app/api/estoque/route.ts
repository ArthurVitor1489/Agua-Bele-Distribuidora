import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const produtosComEstoque = await prisma.produto.findMany({
      where: { ativo: true },
      include: {
        estoque: true,
      },
      orderBy: { nome: 'asc' },
    });

    const garrafoes = await prisma.estoqueGarrafao.findMany({
      orderBy: [
        { anoFabricacao: 'desc' },
        { status: 'asc' },
      ],
    });

    // Média de vendas dos últimos 30 dias para cálculo de autonomia
    const dataLimite30Dias = new Date();
    dataLimite30Dias.setDate(dataLimite30Dias.getDate() - 30);

    const vendasRecentes = await prisma.pedidoItem.groupBy({
      by: ['produtoId'],
      where: {
        pedido: {
          data: { gte: dataLimite30Dias },
          status: { not: 'CANCELADO' },
        },
      },
      _sum: {
        quantidade: true,
      },
    });

    const vendasPorProdutoMap = new Map<string, number>();
    vendasRecentes.forEach((v) => {
      vendasPorProdutoMap.set(v.produtoId, v._sum.quantidade || 0);
    });

    const produtosComAutonomia = produtosComEstoque.map((p) => {
      const totalVendido30Dias = vendasPorProdutoMap.get(p.id) || 0;
      const mediaDiaria = totalVendido30Dias > 0 ? Number((totalVendido30Dias / 30).toFixed(1)) : 0;
      const estoqueAtual = p.estoque?.quantidadeAtual || 0;
      const diasAutonomia = mediaDiaria > 0 ? Math.round(estoqueAtual / mediaDiaria) : null;

      return {
        ...p,
        mediaDiariaVendas: mediaDiaria,
        diasAutonomia,
      };
    });

    const anoAtual = new Date().getFullYear();

    // Consolidado por situação
    const consolidadoGarrafoes = {
      CHEIO: 0,
      VAZIO: 0,
      DISPONIVEL: 0,
      DANIFICADO: 0,
      QUEBRADO: 0,
      VENCIDO: 0,
      DESCARTADO: 0,
      totalAtivo: 0,
      totalGeral: 0,
      proximoVencimento: 0,
      taxaAvarias: 0,
    };

    garrafoes.forEach((g) => {
      consolidadoGarrafoes.totalGeral += g.quantidade;

      if (g.status === 'CHEIO') consolidadoGarrafoes.CHEIO += g.quantidade;
      else if (g.status === 'VAZIO' || g.status === 'DISPONIVEL') consolidadoGarrafoes.VAZIO += g.quantidade;
      else if (g.status === 'DANIFICADO') consolidadoGarrafoes.DANIFICADO += g.quantidade;
      else if (g.status === 'QUEBRADO') consolidadoGarrafoes.QUEBRADO += g.quantidade;
      else if (g.status === 'VENCIDO') consolidadoGarrafoes.VENCIDO += g.quantidade;
      else if (g.status === 'DESCARTADO') consolidadoGarrafoes.DESCARTADO += g.quantidade;

      if (['CHEIO', 'VAZIO', 'DISPONIVEL'].includes(g.status)) {
        consolidadoGarrafoes.totalAtivo += g.quantidade;
      }

      if (g.anoValidade <= anoAtual + 1 && !['VENCIDO', 'DESCARTADO'].includes(g.status)) {
        consolidadoGarrafoes.proximoVencimento += g.quantidade;
      }
    });

    const totalAguaEstoque = produtosComEstoque
      .filter((p) => p.categoria === 'AGUA_25L')
      .reduce((acc, p) => acc + (p.estoque?.quantidadeAtual || 0), 0);

    // Se houver qualquer divergência de registro histórico, garante paridade perfeita
    if (totalAguaEstoque > 0 && consolidadoGarrafoes.CHEIO !== totalAguaEstoque) {
      consolidadoGarrafoes.totalGeral += (totalAguaEstoque - consolidadoGarrafoes.CHEIO);
      consolidadoGarrafoes.CHEIO = totalAguaEstoque;
    }

    const totalDanificados = consolidadoGarrafoes.DANIFICADO + consolidadoGarrafoes.QUEBRADO;
    consolidadoGarrafoes.taxaAvarias = consolidadoGarrafoes.totalGeral > 0
      ? Number(((totalDanificados / consolidadoGarrafoes.totalGeral) * 100).toFixed(1))
      : 0;

    return NextResponse.json({
      produtos: produtosComAutonomia,
      garrafoes,
      consolidadoGarrafoes,
    });
  } catch (error: any) {
    console.error('Erro ao consultar estoque:', error);
    return NextResponse.json({ error: error.message || 'Erro ao consultar estoque' }, { status: 500 });
  }
}
