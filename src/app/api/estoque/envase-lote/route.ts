import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itens, motivo, atualizarGarrafoes } = body;

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({ error: 'Nenhum item informado para a carga/envase' }, { status: 400 });
    }

    const itensValidos = itens.filter((item: any) => Number(item.quantidade) > 0);

    if (itensValidos.length === 0) {
      return NextResponse.json({ error: 'Informe uma quantidade maior que zero para pelo menos um produto' }, { status: 400 });
    }

    const anoAtual = new Date().getFullYear();

    const resultado = await prisma.$transaction(async (tx) => {
      let totalQtdAgua = 0;

      for (const item of itensValidos) {
        const qtd = Number(item.quantidade);
        const produto = await tx.produto.findUnique({
          where: { id: item.produtoId },
          include: { estoque: true },
        });

        if (!produto) continue;

        if (produto.categoria === 'AGUA_20L') {
          totalQtdAgua += qtd;
        }

        const estoqueAtual = produto.estoque?.quantidadeAtual || 0;
        const novaQtd = estoqueAtual + qtd;

        // Atualiza ou cria estoque do produto
        await tx.estoqueProduto.upsert({
          where: { produtoId: produto.id },
          update: {
            quantidadeAtual: novaQtd,
          },
          create: {
            produtoId: produto.id,
            quantidadeAtual: novaQtd,
            quantidadeMinima: 10,
          },
        });

        // Registra movimentação individual
        await tx.movimentacaoEstoque.create({
          data: {
            tipo: 'ENTRADA',
            quantidade: qtd,
            produtoId: produto.id,
            motivo: motivo?.trim() || `Chegada de carga / Envase (${produto.nome})`,
          },
        });
      }

      // Se marcado para atualizar o ciclo de garrafões (Vazios -> Cheios)
      if (atualizarGarrafoes && totalQtdAgua > 0) {
        let restanteParaDebitar = totalQtdAgua;
        const lotesVazios = await tx.estoqueGarrafao.findMany({
          where: { status: 'VAZIO', quantidade: { gt: 0 } },
          orderBy: { anoFabricacao: 'asc' },
        });

        for (const lote of lotesVazios) {
          if (restanteParaDebitar <= 0) break;
          const aDebitar = Math.min(lote.quantidade, restanteParaDebitar);
          await tx.estoqueGarrafao.update({
            where: { id: lote.id },
            data: { quantidade: { decrement: aDebitar } },
          });
          restanteParaDebitar -= aDebitar;
        }

        // Credita garrafões cheios no lote do ano atual
        let loteCheio = await tx.estoqueGarrafao.findFirst({
          where: { status: 'CHEIO', anoFabricacao: anoAtual },
        });

        if (loteCheio) {
          await tx.estoqueGarrafao.update({
            where: { id: loteCheio.id },
            data: { quantidade: { increment: totalQtdAgua } },
          });
        } else {
          await tx.estoqueGarrafao.create({
            data: {
              anoFabricacao: anoAtual,
              anoValidade: anoAtual + 3,
              quantidade: totalQtdAgua,
              status: 'CHEIO',
              observacoes: `Carga / Envase diário de ${totalQtdAgua} galões`,
            },
          });
        }
      }

      return { totalItens: itensValidos.length, totalAgua: totalQtdAgua };
    });

    return NextResponse.json({
      success: true,
      resultado,
      mensagem: `Carga de ${resultado.totalAgua} galões lançada com sucesso no estoque!`,
    });
  } catch (error: any) {
    console.error('Erro ao lançar carga de envase:', error);
    return NextResponse.json({ error: error.message || 'Erro ao lançar carga de envase' }, { status: 500 });
  }
}
