import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Editar diretamente um lote de garrafões (quantidade, situação, ano ou observações)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const novaQtd = Number(body.quantidade);
    const novoStatus = body.status;
    const novoAno = body.anoFabricacao ? Number(body.anoFabricacao) : undefined;
    const observacoes = body.observacoes?.trim();

    if (isNaN(novaQtd) || novaQtd < 0) {
      return NextResponse.json({ error: 'Informe uma quantidade válida (zero ou maior).' }, { status: 400 });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const lote = await tx.estoqueGarrafao.findUnique({
        where: { id },
      });

      if (!lote) {
        throw new Error('Lote de garrafões não encontrado.');
      }

      const statusFinal = novoStatus || lote.status;
      const anoFinal = novoAno || lote.anoFabricacao;

      const loteAtualizado = await tx.estoqueGarrafao.update({
        where: { id },
        data: {
          quantidade: novaQtd,
          status: statusFinal,
          anoFabricacao: anoFinal,
          anoValidade: anoFinal + 3,
          observacoes: observacoes !== undefined ? observacoes : lote.observacoes,
        },
      });

      // Registrar histórico de ajuste
      await tx.movimentacaoEstoque.create({
        data: {
          tipo: 'AJUSTE',
          quantidade: Math.abs(novaQtd - lote.quantidade),
          estoqueGarrafaoId: id,
          motivo: body.motivo || `Ajuste manual de saldo no lote ${anoFinal} (${statusFinal}) de ${lote.quantidade} para ${novaQtd}`,
        },
      });

      // Se alterou um lote CHEIO, auto-sincroniza o EstoqueProduto para manter paridade perfeita 1:1
      if (lote.status === 'CHEIO' || statusFinal === 'CHEIO') {
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

      return loteAtualizado;
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Erro ao editar lote de garrafões:', error);
    return NextResponse.json({ error: error.message || 'Erro ao editar lote de garrafões' }, { status: 500 });
  }
}

// Excluir um lote de garrafões lançado por engano
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const resultado = await prisma.$transaction(async (tx) => {
      const lote = await tx.estoqueGarrafao.findUnique({
        where: { id },
      });

      if (!lote) {
        throw new Error('Lote de garrafões não encontrado.');
      }

      // 1. Remover movimentações associadas a este lote
      await tx.movimentacaoEstoque.deleteMany({
        where: { estoqueGarrafaoId: id },
      });

      // 2. Apagar lote
      await tx.estoqueGarrafao.delete({
        where: { id },
      });

      // 3. Se era lote CHEIO, auto-sincronizar EstoqueProduto
      if (lote.status === 'CHEIO') {
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

      return { sucesso: true };
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Erro ao excluir lote de garrafões:', error);
    return NextResponse.json({ error: error.message || 'Erro ao excluir lote' }, { status: 500 });
  }
}
