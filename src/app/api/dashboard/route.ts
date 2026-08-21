import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'mes';

    // Determinar intervalo de datas
    const now = new Date();
    let dataInicio = new Date();

    if (periodo === 'hoje') {
      dataInicio.setHours(0, 0, 0, 0);
    } else if (periodo === '7dias') {
      dataInicio.setDate(now.getDate() - 7);
      dataInicio.setHours(0, 0, 0, 0);
    } else if (periodo === 'ano') {
      dataInicio = new Date(now.getFullYear(), 0, 1);
    } else {
      // 'mes' default
      dataInicio = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // 1. Pedidos do período (exceto cancelados para faturamento)
    const pedidos = await prisma.pedido.findMany({
      where: {
        data: { gte: dataInicio },
      },
      include: {
        itens: { include: { produto: true } },
        pagamentos: true,
        fiado: true,
        boletoReceber: { include: { parcelas: true } },
      },
    });

    const pedidosValidos = pedidos.filter((p) => p.status !== 'CANCELADO');

    // Faturamento = Total vendido nos pedidos não cancelados
    const faturamento = pedidosValidos.reduce((acc, p) => acc + p.total, 0);

    // 2. Recebimentos efetivos no período (Pagamentos realizados por PIX, Dinheiro, Cartão ou Boleto baixado)
    const pagamentos = await prisma.pagamento.findMany({
      where: {
        dataPagamento: { gte: dataInicio },
      },
    });

    // Recebimentos de amortização de fiado no período
    const amortizacoesFiado = await prisma.fiadoHistorico.findMany({
      where: {
        dataPagamento: { gte: dataInicio },
      },
    });

    const totalRecebidoPagamentos = pagamentos.reduce((acc, p) => acc + p.valor, 0);
    const totalRecebidoFiados = amortizacoesFiado.reduce((acc, h) => acc + h.valorPago, 0);
    const recebido = totalRecebidoPagamentos + totalRecebidoFiados;

    // 3. Em Aberto (Fiados com saldo > 0 + Boletos com parcelas pendentes/vencidas)
    const fiadosAbertos = await prisma.fiado.findMany({
      where: {
        saldo: { gt: 0 },
      },
    });
    const totalFiadosEmAberto = fiadosAbertos.reduce((acc, f) => acc + f.saldo, 0);

    const parcelasAbertas = await prisma.boletoParcela.findMany({
      where: {
        status: { in: ['PENDENTE', 'VENCIDA'] },
      },
    });
    const totalBoletosEmAberto = parcelasAbertas.reduce((acc, b) => acc + b.valor, 0);

    const emAberto = totalFiadosEmAberto + totalBoletosEmAberto;

    // 4. Despesas do período
    const despesasDb = await prisma.despesa.findMany({
      where: {
        data: { gte: dataInicio },
      },
    });
    const despesas = despesasDb.reduce((acc, d) => acc + d.valor, 0);

    // Resultado = Recebimentos - Despesas
    const resultado = recebido - despesas;

    // 5. Detalhamento por Forma de Pagamento Efetiva
    const formaMap: Record<string, { valor: number; quantidade: number }> = {
      PIX: { valor: 0, quantidade: 0 },
      DINHEIRO: { valor: 0, quantidade: 0 },
      DEBITO: { valor: 0, quantidade: 0 },
      CREDITO: { valor: 0, quantidade: 0 },
      BOLETO: { valor: 0, quantidade: 0 },
    };

    pagamentos.forEach((p) => {
      const f = p.forma || 'OUTRO';
      if (!formaMap[f]) {
        formaMap[f] = { valor: 0, quantidade: 0 };
      }
      formaMap[f].valor += p.valor;
      formaMap[f].quantidade += 1;
    });

    amortizacoesFiado.forEach((h) => {
      const f = h.formaPagamento || 'PIX';
      if (!formaMap[f]) {
        formaMap[f] = { valor: 0, quantidade: 0 };
      }
      formaMap[f].valor += h.valorPago;
      formaMap[f].quantidade += 1;
    });

    const recebimentoPorForma = Object.entries(formaMap).map(([forma, dados]) => ({
      forma,
      valor: dados.valor,
      quantidade: dados.quantidade,
    }));

    // 6. Pedidos por Status
    const statusCount: Record<string, { quantidade: number; valorTotal: number }> = {
      PENDENTE: { quantidade: 0, valorTotal: 0 },
      EM_ANDAMENTO: { quantidade: 0, valorTotal: 0 },
      ENTREGUE: { quantidade: 0, valorTotal: 0 },
      CANCELADO: { quantidade: 0, valorTotal: 0 },
    };

    pedidos.forEach((p) => {
      if (statusCount[p.status]) {
        statusCount[p.status].quantidade += 1;
        statusCount[p.status].valorTotal += p.total;
      }
    });

    const pedidosPorStatus = Object.entries(statusCount).map(([status, d]) => ({
      status: status as any,
      quantidade: d.quantidade,
      valorTotal: d.valorTotal,
    }));

    // 7. Boletos Resumo
    const parcelasPendentes = parcelasAbertas.filter((p) => p.status === 'PENDENTE');
    const parcelasVencidas = parcelasAbertas.filter((p) => {
      const venc = new Date(p.dataVencimento);
      return p.status === 'VENCIDA' || (p.status === 'PENDENTE' && venc < now);
    });

    // 8. Estoque Resumo (Água e Garrafões)
    const estoqueAgua = await prisma.estoqueProduto.findFirst({
      where: { produto: { categoria: 'AGUA_20L' } },
    });

    const garrafoes = await prisma.estoqueGarrafao.findMany();
    let garrafoesCheios = 0;
    let garrafoesVazios = 0;
    let garrafoesDanificados = 0;
    let garrafoesQuebrados = 0;
    let garrafoesVencidos = 0;
    let garrafoesDescartados = 0;
    let garrafoesProximoVencimento = 0;

    const anoAtual = now.getFullYear();

    garrafoes.forEach((g) => {
      if (g.status === 'CHEIO') garrafoesCheios += g.quantidade;
      else if (g.status === 'VAZIO' || g.status === 'DISPONIVEL') garrafoesVazios += g.quantidade;
      else if (g.status === 'DANIFICADO') garrafoesDanificados += g.quantidade;
      else if (g.status === 'QUEBRADO') garrafoesQuebrados += g.quantidade;
      else if (g.status === 'VENCIDO') garrafoesVencidos += g.quantidade;
      else if (g.status === 'DESCARTADO') garrafoesDescartados += g.quantidade;

      if (g.anoValidade <= anoAtual + 1 && g.status !== 'VENCIDO' && g.status !== 'DESCARTADO') {
        garrafoesProximoVencimento += g.quantidade;
      }
    });

    // 9. Notas Fiscais Resumo
    let notas = await prisma.notaFiscal.findMany({
      where: {
        OR: [
          { dataEmissao: { gte: dataInicio } },
          { createdAt: { gte: dataInicio } },
        ],
      },
    });

    if (notas.length === 0) {
      notas = await prisma.notaFiscal.findMany();
    }

    const valorTotalNotas = notas.reduce((acc, n) => acc + n.valorTotal, 0);
    const tributosDestacados = notas.reduce(
      (acc, n) => acc + n.valorIcms + n.valorPis + n.valorCofins + n.outrosTributos,
      0
    );

    return NextResponse.json({
      faturamento,
      recebido,
      emAberto,
      despesas,
      resultado,
      recebimentoPorForma,
      pedidosPorStatus,
      fiadosResumo: {
        clientesDevendo: fiadosAbertos.length,
        valorTotalEmAberto: totalFiadosEmAberto,
      },
      boletosResumo: {
        quantidadePendente: parcelasPendentes.length,
        quantidadeVencida: parcelasVencidas.length,
        valorTotalEmAberto: totalBoletosEmAberto,
      },
      estoqueResumo: {
        aguaDisponivel: estoqueAgua?.quantidadeAtual || 0,
        garrafoesCheios,
        garrafoesVazios,
        garrafoesDanificados,
        garrafoesQuebrados,
        garrafoesVencidos,
        garrafoesDescartados,
        garrafoesProximoVencimento,
      },
      notasFiscaisResumo: {
        quantidadeNotas: notas.length,
        valorTotal: valorTotalNotas,
        tributosDestacados,
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar dashboard:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
