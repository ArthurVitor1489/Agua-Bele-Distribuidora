import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { produtoId, tipo, quantidade, motivo, envasarGarrafoes, quantidadeMinima } = body;

    if (!produtoId) {
      return NextResponse.json({ error: 'Selecione o produto' }, { status: 400 });
    }

    const qtd = Number(quantidade);
    if (isNaN(qtd) || qtd <= 0) {
      return NextResponse.json({ error: 'Informe uma quantidade válida maior que zero' }, { status: 400 });
    }

    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
      include: { estoque: true },
    });

    if (!produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    const anoAtual = new Date().getFullYear();

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Atualizar ou criar o estoque do produto
      let estoqueAtual = produto.estoque?.quantidadeAtual || 0;
      let novaQtd = estoqueAtual;

      if (tipo === 'ENTRADA') {
        novaQtd = estoqueAtual + qtd;
      } else if (tipo === 'SAIDA') {
        novaQtd = Math.max(0, estoqueAtual - qtd);
      } else if (tipo === 'AJUSTE') {
        novaQtd = qtd;
      } else {
        novaQtd = estoqueAtual + qtd;
      }

      const estoqueAtualizado = await tx.estoqueProduto.upsert({
        where: { produtoId: produto.id },
        update: {
          quantidadeAtual: novaQtd,
          ...(quantidadeMinima !== undefined ? { quantidadeMinima: Number(quantidadeMinima) } : {}),
        },
        create: {
          produtoId: produto.id,
          quantidadeAtual: novaQtd,
          quantidadeMinima: quantidadeMinima ? Number(quantidadeMinima) : 10,
        },
      });

      // 2. Registrar no Histórico de Movimentações
      await tx.movimentacaoEstoque.create({
        data: {
          tipo: tipo || 'ENTRADA',
          quantidade: qtd,
          produtoId: produto.id,
          motivo: motivo?.trim() || `Entrada manual no estoque (${produto.nome})`,
        },
      });

      // 3. Se for produto da categoria AGUA_20L e foi marcada a opção de envase de garrafões
      if (produto.categoria === 'AGUA_20L' && tipo === 'ENTRADA' && envasarGarrafoes) {
        // Debita garrafões vazios se houver
        let restanteParaDebitar = qtd;
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
            data: { quantidade: { increment: qtd } },
          });
        } else {
          await tx.estoqueGarrafao.create({
            data: {
              anoFabricacao: anoAtual,
              anoValidade: anoAtual + 3,
              quantidade: qtd,
              status: 'CHEIO',
              observacoes: `Envase registrado de ${produto.nome}`,
            },
          });
        }
      }

      return estoqueAtualizado;
    });

    return NextResponse.json({
      success: true,
      estoque: resultado,
      mensagem: `Estoque de ${produto.nome} atualizado com sucesso!`,
    });
  } catch (error: any) {
    console.error('Erro ao registrar entrada de estoque:', error);
    return NextResponse.json({ error: error.message || 'Erro ao registrar entrada de estoque' }, { status: 500 });
  }
}
