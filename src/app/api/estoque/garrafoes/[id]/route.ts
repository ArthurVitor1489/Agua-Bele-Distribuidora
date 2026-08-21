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

      // Registrar histórico de ajuste no lote de garrafões
      await tx.movimentacaoEstoque.create({
        data: {
          tipo: 'AJUSTE',
          quantidade: Math.abs(novaQtd - lote.quantidade),
          estoqueGarrafaoId: id,
          motivo: body.motivo || `Ajuste manual de saldo no lote ${anoFinal} (${statusFinal}) de ${lote.quantidade} para ${novaQtd}`,
        },
      });

      // Se uma marca de produto específica foi selecionada para abater/acrescentar o saldo
      const produtoId = body.produtoId;
      const deltaQtd = novaQtd - lote.quantidade;

      if (produtoId && deltaQtd !== 0) {
        const produto = await tx.produto.findUnique({
          where: { id: produtoId },
          include: { estoque: true },
        });

        if (produto) {
          const qtdAtual = produto.estoque?.quantidadeAtual || 0;
          const novaQtdProduto = Math.max(0, qtdAtual + deltaQtd);

          await tx.estoqueProduto.upsert({
            where: { produtoId: produto.id },
            update: { quantidadeAtual: novaQtdProduto },
            create: { produtoId: produto.id, quantidadeAtual: novaQtdProduto, quantidadeMinima: 10 },
          });

          await tx.movimentacaoEstoque.create({
            data: {
              tipo: deltaQtd > 0 ? 'ENTRADA' : 'SAIDA',
              quantidade: Math.abs(deltaQtd),
              produtoId: produto.id,
              motivo: body.motivo || `Ajuste manual de ${Math.abs(deltaQtd)} un no produto ${produto.nome}`,
            },
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

      return { sucesso: true };
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Erro ao excluir lote de garrafões:', error);
    return NextResponse.json({ error: error.message || 'Erro ao excluir lote' }, { status: 500 });
  }
}
