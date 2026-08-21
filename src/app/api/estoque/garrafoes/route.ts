import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const lotes = await prisma.estoqueGarrafao.findMany({
      orderBy: [
        { anoFabricacao: 'desc' },
        { status: 'asc' },
      ],
    });

    return NextResponse.json(lotes);
  } catch (error: any) {
    console.error('Erro ao listar lotes de garrafões:', error);
    return NextResponse.json({ error: error.message || 'Erro ao listar lotes' }, { status: 500 });
  }
}

// Entrada de novos garrafões ou cadastro de lote
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const anoFabricacao = Number(body.anoFabricacao);
    const quantidade = Number(body.quantidade);
    const status = body.status || 'DISPONIVEL'; // DISPONIVEL, CHEIO, VAZIO, etc.
    const observacoes = body.observacoes?.trim() || null;

    if (!anoFabricacao || anoFabricacao < 2000 || anoFabricacao > 2100) {
      return NextResponse.json({ error: 'Ano de fabricação inválido' }, { status: 400 });
    }

    if (!quantidade || quantidade <= 0) {
      return NextResponse.json({ error: 'Quantidade deve ser maior que zero' }, { status: 400 });
    }

    // Regra: validade de 3 anos a partir da fabricação
    const anoValidade = Number(body.anoValidade) || (anoFabricacao + 3);

    const resultado = await prisma.$transaction(async (tx) => {
      // Verificar se já existe lote com mesmo ano e status para acumular ou criar novo
      let lote = await tx.estoqueGarrafao.findFirst({
        where: {
          anoFabricacao,
          anoValidade,
          status,
        },
      });

      if (lote) {
        lote = await tx.estoqueGarrafao.update({
          where: { id: lote.id },
          data: {
            quantidade: lote.quantidade + quantidade,
            observacoes: observacoes ? `${lote.observacoes || ''} | ${observacoes}`.trim() : lote.observacoes,
          },
        });
      } else {
        lote = await tx.estoqueGarrafao.create({
          data: {
            anoFabricacao,
            anoValidade,
            quantidade,
            status,
            observacoes,
          },
        });
      }

      // Registrar movimentação de estoque
      await tx.movimentacaoEstoque.create({
        data: {
          tipo: 'ENTRADA',
          quantidade,
          estoqueGarrafaoId: lote.id,
          motivo: body.motivo || `Entrada de ${quantidade} garrafões lote ${anoFabricacao} (${status})`,
        },
      });

      return lote;
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao registrar entrada de garrafões:', error);
    return NextResponse.json({ error: error.message || 'Erro ao registrar entrada' }, { status: 500 });
  }
}

// Movimentação/Transição entre situações (ex: Vazio -> Cheio [Envase], Cheio/Vazio -> Danificado/Quebrado, Vencido -> Descarte)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      origemId,
      statusDestino,
      quantidade,
      motivo,
      produtoId,
      tipoMovimentacao = 'AJUSTE',
    } = body;

    const qtd = Number(quantidade);

    if (!origemId || !statusDestino || !qtd || qtd <= 0) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos. Informe origem, status de destino e quantidade positiva.' },
        { status: 400 }
      );
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const loteOrigem = await tx.estoqueGarrafao.findUnique({
        where: { id: origemId },
      });

      if (!loteOrigem) {
        throw new Error('Lote de origem não encontrado.');
      }

      if (loteOrigem.status === statusDestino) {
        throw new Error(`A situação de destino (${statusDestino}) deve ser diferente da situação de origem (${loteOrigem.status}).`);
      }

      let produtoRef: any = null;
      if (produtoId) {
        produtoRef = await tx.produto.findUnique({
          where: { id: produtoId },
          include: { estoque: true },
        });

        if (produtoRef) {
          const qtdAtual = produtoRef.estoque?.quantidadeAtual || 0;

          // Se a origem for CHEIO e a destino NÃO for CHEIO (ex: Avaria, Descarte, Vazio), reduz o estoque do produto
          if (loteOrigem.status === 'CHEIO' && statusDestino !== 'CHEIO') {
            await tx.estoqueProduto.upsert({
              where: { produtoId: produtoRef.id },
              update: { quantidadeAtual: Math.max(0, qtdAtual - qtd) },
              create: { produtoId: produtoRef.id, quantidadeAtual: 0, quantidadeMinima: 10 },
            });
          }
          // Se a origem NÃO for CHEIO e a destino for CHEIO (Envase / Triagem), soma no estoque do produto
          else if (loteOrigem.status !== 'CHEIO' && statusDestino === 'CHEIO') {
            await tx.estoqueProduto.upsert({
              where: { produtoId: produtoRef.id },
              update: { quantidadeAtual: qtdAtual + qtd },
              create: { produtoId: produtoRef.id, quantidadeAtual: qtd, quantidadeMinima: 10 },
            });
          }
        }
      }

      // 1. Debitar da origem
      await tx.estoqueGarrafao.update({
        where: { id: origemId },
        data: {
          quantidade: loteOrigem.quantidade - qtd,
        },
      });

      // 2. Creditar no destino (mesmo anoFabricacao e anoValidade)
      let loteDestino = await tx.estoqueGarrafao.findFirst({
        where: {
          anoFabricacao: loteOrigem.anoFabricacao,
          anoValidade: loteOrigem.anoValidade,
          status: statusDestino,
        },
      });

      if (loteDestino) {
        loteDestino = await tx.estoqueGarrafao.update({
          where: { id: loteDestino.id },
          data: {
            quantidade: loteDestino.quantidade + qtd,
          },
        });
      } else {
        loteDestino = await tx.estoqueGarrafao.create({
          data: {
            anoFabricacao: loteOrigem.anoFabricacao,
            anoValidade: loteOrigem.anoValidade,
            quantidade: qtd,
            status: statusDestino,
            observacoes: `Criado a partir de movimentação de ${loteOrigem.status}`,
          },
        });
      }

      const tipoFinal = statusDestino === 'DANIFICADO' ? 'DANIFICADO' : tipoMovimentacao;
      const motivoFinal = motivo || (produtoRef
        ? `Avaria / Movimentação de ${qtd} garrafões de ${produtoRef.nome} (${loteOrigem.status} → ${statusDestino})`
        : `Transferência de ${qtd} garrafões de ${loteOrigem.status} para ${statusDestino}`);

      // 3. Registrar auditoria de movimentação
      await tx.movimentacaoEstoque.create({
        data: {
          tipo: tipoFinal,
          quantidade: qtd,
          produtoId: produtoRef ? produtoRef.id : null,
          estoqueGarrafaoId: loteDestino.id,
          motivo: motivoFinal,
        },
      });

      return { sucesso: true, loteOrigem, loteDestino };
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Erro ao movimentar garrafões:', error);
    return NextResponse.json({ error: error.message || 'Erro ao movimentar garrafões' }, { status: 500 });
  }
}
