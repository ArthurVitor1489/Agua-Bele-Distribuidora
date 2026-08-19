import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const status = searchParams.get('status');

    const where: any = {};
    if (categoria) {
      where.categoria = categoria;
    }
    if (status) {
      where.status = status;
    }

    const despesas = await prisma.despesa.findMany({
      where,
      orderBy: { data: 'desc' },
      include: {
        boletoPagar: true,
      },
    });

    const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);
    const totalPagas = despesas.filter((d) => d.status === 'PAGA').reduce((acc, d) => acc + d.valor, 0);
    const totalPendentes = despesas.filter((d) => d.status === 'PENDENTE').reduce((acc, d) => acc + d.valor, 0);

    return NextResponse.json({
      despesas,
      resumo: {
        totalDespesas,
        totalPagas,
        totalPendentes,
      },
    });
  } catch (error: any) {
    console.error('Erro ao listar despesas:', error);
    return NextResponse.json({ error: error.message || 'Erro ao listar despesas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      categoria,
      descricao,
      valor,
      data,
      formaPagamento = 'PIX',
      status = 'PAGA',
      observacoes,
      // Se for boleto a pagar de fornecedor:
      boletoPagar,
    } = body;

    if (!descricao || descricao.trim() === '') {
      return NextResponse.json({ error: 'Descrição da despesa é obrigatória' }, { status: 400 });
    }

    const val = Number(valor);
    if (!val || val <= 0) {
      return NextResponse.json({ error: 'Valor da despesa deve ser maior que zero' }, { status: 400 });
    }

    const dataDespesa = data ? new Date(data) : new Date();

    const novaDespesa = await prisma.$transaction(async (tx) => {
      let boletoPagarId: string | null = null;

      if (boletoPagar && boletoPagar.fornecedor) {
        const bp = await tx.boletoPagar.create({
          data: {
            fornecedor: boletoPagar.fornecedor.trim(),
            numero: boletoPagar.numero || `BOL-FORN-${Date.now().toString().slice(-4)}`,
            valor: val,
            dataVencimento: boletoPagar.dataVencimento ? new Date(boletoPagar.dataVencimento) : dataDespesa,
            status: status === 'PAGA' ? 'PAGO' : 'PENDENTE',
          },
        });
        boletoPagarId = bp.id;
      }

      const d = await tx.despesa.create({
        data: {
          categoria: categoria || 'OUTROS',
          descricao: descricao.trim(),
          valor: val,
          data: dataDespesa,
          formaPagamento,
          status,
          observacoes: observacoes?.trim() || null,
          boletoPagarId,
        },
        include: {
          boletoPagar: true,
        },
      });

      return d;
    });

    return NextResponse.json(novaDespesa, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar despesa:', error);
    return NextResponse.json({ error: error.message || 'Erro ao criar despesa' }, { status: 500 });
  }
}
