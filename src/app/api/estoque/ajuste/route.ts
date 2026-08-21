import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { target, produtoId, anoFabricacao, quantidadeReal, motivo } = body;

    const qtdReal = Number(quantidadeReal);
    if (isNaN(qtdReal) || qtdReal < 0) {
      return NextResponse.json({ error: 'Informe uma quantidade real válida (zero ou maior).' }, { status: 400 });
    }

    const ano = Number(anoFabricacao) || new Date().getFullYear();
    const justificativa = motivo?.trim() || 'Ajuste manual de calibragem de estoque';

    const resultado = await prisma.$transaction(async (tx) => {
      if (target === 'PRODUTO') {
        if (!produtoId) {
          throw new Error('Selecione o produto a ser ajustado.');
        }

        const produto = await tx.produto.findUnique({
          where: { id: produtoId },
          include: { estoque: true },
        });

        if (!produto) {
          throw new Error('Produto não encontrado.');
        }

        const estoqueAnterior = produto.estoque?.quantidadeAtual || 0;

        const estoqueAtualizado = await tx.estoqueProduto.upsert({
          where: { produtoId },
          update: { quantidadeAtual: qtdReal },
          create: { produtoId, quantidadeAtual: qtdReal, quantidadeMinima: 10 },
        });

        await tx.movimentacaoEstoque.create({
          data: {
            tipo: 'AJUSTE',
            quantidade: Math.abs(qtdReal - estoqueAnterior),
            produtoId,
            motivo: `[Ajuste de Estoque] ${justificativa} (De ${estoqueAnterior} para ${qtdReal})`,
          },
        });

        return { sucesso: true, produto: produto.nome, novoSaldo: qtdReal };
      } else {
        // Trata ajuste de garrafões (VAZIO, CHEIO, DANIFICADO, DESCARTE)
        let status: 'VAZIO' | 'CHEIO' | 'DANIFICADO' | 'DESCARTE' = 'VAZIO';
        if (target === 'GARRAFAO_CHEIO') status = 'CHEIO';
        else if (target === 'GARRAFAO_DANIFICADO') status = 'DANIFICADO';
        else if (target === 'GARRAFAO_DESCARTE') status = 'DESCARTE';
        else status = 'VAZIO';

        let lote = await tx.estoqueGarrafao.findFirst({
          where: { status, anoFabricacao: ano },
        });

        const qtdAnterior = lote?.quantidade || 0;

        if (lote) {
          lote = await tx.estoqueGarrafao.update({
            where: { id: lote.id },
            data: { quantidade: qtdReal, observacoes: justificativa },
          });
        } else {
          lote = await tx.estoqueGarrafao.create({
            data: {
              status,
              anoFabricacao: ano,
              anoValidade: ano + 3,
              quantidade: qtdReal,
              observacoes: justificativa,
            },
          });
        }

        await tx.movimentacaoEstoque.create({
          data: {
            tipo: 'AJUSTE',
            quantidade: Math.abs(qtdReal - qtdAnterior),
            estoqueGarrafaoId: lote.id,
            motivo: `[Ajuste de Garrafões] ${justificativa} (Status: ${status}, De ${qtdAnterior} para ${qtdReal})`,
          },
        });

        // Se o ajuste foi em garrafões CHEIO, auto-sincronizar o EstoqueProduto para manter paridade 1:1
        if (status === 'CHEIO') {
          const produtoAgua = await tx.produto.findFirst({
            where: { categoria: 'AGUA_20L' },
          });

          if (produtoAgua) {
            const todosCheios = await tx.estoqueGarrafao.aggregate({
              where: { status: 'CHEIO' },
              _sum: { quantidade: true },
            });
            const totalCheios = todosCheios._sum.quantidade || 0;

            await tx.estoqueProduto.upsert({
              where: { produtoId: produtoAgua.id },
              update: { quantidadeAtual: totalCheios },
              create: { produtoId: produtoAgua.id, quantidadeAtual: totalCheios, quantidadeMinima: 10 },
            });
          }
        }

        return { sucesso: true, status, novoSaldo: qtdReal };
      }
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Erro ao realizar ajuste de estoque:', error);
    return NextResponse.json({ error: error.message || 'Erro ao realizar ajuste de estoque' }, { status: 500 });
  }
}
