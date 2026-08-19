import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'mes';

    const now = new Date();
    let dataInicio = new Date();

    if (periodo === 'diario' || periodo === 'hoje') {
      dataInicio.setHours(0, 0, 0, 0);
    } else if (periodo === '7dias') {
      dataInicio.setDate(now.getDate() - 7);
      dataInicio.setHours(0, 0, 0, 0);
    } else if (periodo === 'ano') {
      dataInicio = new Date(now.getFullYear(), 0, 1);
    } else {
      // 'mes'
      dataInicio = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Pedidos do período
    const pedidos = await prisma.pedido.findMany({
      where: {
        data: { gte: dataInicio },
        status: { not: 'CANCELADO' },
      },
      include: {
        cliente: true,
        itens: { include: { produto: true } },
      },
      orderBy: { data: 'desc' },
    });

    const faturamentoTotal = pedidos.reduce((acc, p) => acc + p.total, 0);

    // Recebimentos no período
    const pagamentos = await prisma.pagamento.findMany({
      where: { dataPagamento: { gte: dataInicio } },
    });
    const fiadosPagos = await prisma.fiadoHistorico.findMany({
      where: { dataPagamento: { gte: dataInicio } },
    });

    const recebimentosTotal =
      pagamentos.reduce((acc, p) => acc + p.valor, 0) +
      fiadosPagos.reduce((acc, h) => acc + h.valorPago, 0);

    // Em Aberto
    const fiados = await prisma.fiado.findMany({
      where: { saldo: { gt: 0 } },
    });
    const boletos = await prisma.boletoParcela.findMany({
      where: { status: { in: ['PENDENTE', 'VENCIDA'] } },
    });

    const totalFiadosEmAberto = fiados.reduce((acc, f) => acc + f.saldo, 0);
    const totalBoletosEmAberto = boletos.reduce((acc, b) => acc + b.valor, 0);
    const totalEmAberto = totalFiadosEmAberto + totalBoletosEmAberto;

    // Despesas no período
    const despesas = await prisma.despesa.findMany({
      where: { data: { gte: dataInicio } },
      orderBy: { data: 'desc' },
    });

    const despesasTotal = despesas.reduce((acc, d) => acc + d.valor, 0);
    const resultadoLiquido = recebimentosTotal - despesasTotal;

    // Evolução agrupada por data para gráficos
    const evolucaoMap: Record<string, { faturamento: number; recebido: number; despesa: number }> = {};

    pedidos.forEach((p) => {
      const d = p.data.toISOString().slice(0, 10);
      if (!evolucaoMap[d]) evolucaoMap[d] = { faturamento: 0, recebido: 0, despesa: 0 };
      evolucaoMap[d].faturamento += p.total;
    });

    pagamentos.forEach((p) => {
      const d = p.dataPagamento.toISOString().slice(0, 10);
      if (!evolucaoMap[d]) evolucaoMap[d] = { faturamento: 0, recebido: 0, despesa: 0 };
      evolucaoMap[d].recebido += p.valor;
    });

    fiadosPagos.forEach((h) => {
      const d = h.dataPagamento.toISOString().slice(0, 10);
      if (!evolucaoMap[d]) evolucaoMap[d] = { faturamento: 0, recebido: 0, despesa: 0 };
      evolucaoMap[d].recebido += h.valorPago;
    });

    despesas.forEach((d) => {
      const dt = d.data.toISOString().slice(0, 10);
      if (!evolucaoMap[dt]) evolucaoMap[dt] = { faturamento: 0, recebido: 0, despesa: 0 };
      evolucaoMap[dt].despesa += d.valor;
    });

    const evolucao = Object.entries(evolucaoMap)
      .map(([data, valores]) => ({
        data,
        ...valores,
      }))
      .sort((a, b) => a.data.localeCompare(b.data));

    return NextResponse.json({
      periodo,
      indicadores: {
        faturamentoTotal,
        recebimentosTotal,
        totalEmAberto,
        totalFiadosEmAberto,
        totalBoletosEmAberto,
        despesasTotal,
        resultadoLiquido,
        quantidadePedidos: pedidos.length,
      },
      pedidos,
      despesas,
      evolucao,
    });
  } catch (error: any) {
    console.error('Erro ao buscar faturamento:', error);
    return NextResponse.json({ error: error.message || 'Erro ao buscar faturamento' }, { status: 500 });
  }
}
