import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { numero: { contains: search } },
        { emissorNome: { contains: search } },
        { emissorCnpj: { contains: search } },
        { chaveAcesso: { contains: search } },
      ];
    }

    const notas = await prisma.notaFiscal.findMany({
      where,
      orderBy: { dataEmissao: 'desc' },
      include: {
        itens: true,
      },
    });

    const valorTotalNotas = notas.reduce((acc, n) => acc + n.valorTotal, 0);
    const totalIcms = notas.reduce((acc, n) => acc + n.valorIcms, 0);
    const totalPis = notas.reduce((acc, n) => acc + n.valorPis, 0);
    const totalCofins = notas.reduce((acc, n) => acc + n.valorCofins, 0);
    const totalOutros = notas.reduce((acc, n) => acc + n.outrosTributos, 0);
    const totalTributos = totalIcms + totalPis + totalCofins + totalOutros;

    return NextResponse.json({
      notas,
      resumoFiscal: {
        quantidadeNotas: notas.length,
        valorTotalNotas,
        totalIcms,
        totalPis,
        totalCofins,
        totalOutros,
        totalTributos,
      },
    });
  } catch (error: any) {
    console.error('Erro ao listar notas fiscais:', error);
    return NextResponse.json({ error: error.message || 'Erro ao listar notas fiscais' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      numero,
      serie,
      dataEmissao,
      emissorNome,
      emissorCnpj,
      chaveAcesso,
      valorTotal,
      valorIcms = 0,
      valorPis = 0,
      valorCofins = 0,
      outrosTributos = 0,
      arquivoUrl,
      observacoes,
      itens = [],
    } = body;

    if (!numero || !emissorNome || !emissorCnpj) {
      return NextResponse.json(
        { error: 'Número, Emissor e CNPJ são obrigatórios.' },
        { status: 400 }
      );
    }

    const nota = await prisma.notaFiscal.create({
      data: {
        numero: String(numero).trim(),
        serie: serie ? String(serie).trim() : null,
        dataEmissao: dataEmissao ? new Date(dataEmissao) : new Date(),
        emissorNome: String(emissorNome).trim(),
        emissorCnpj: String(emissorCnpj).trim(),
        chaveAcesso: chaveAcesso?.trim() || null,
        valorTotal: Number(valorTotal) || 0,
        valorIcms: Number(valorIcms) || 0,
        valorPis: Number(valorPis) || 0,
        valorCofins: Number(valorCofins) || 0,
        outrosTributos: Number(outrosTributos) || 0,
        arquivoUrl: arquivoUrl || null,
        observacoes: observacoes?.trim() || null,
        itens: {
          create: Array.isArray(itens)
            ? itens.map((item: any) => ({
                descricao: item.descricao || 'Item da NF-e',
                quantidade: Number(item.quantidade) || 1,
                valorUnitario: Number(item.valorUnitario) || Number(item.valorTotal) || 0,
                valorTotal: Number(item.valorTotal) || 0,
              }))
            : [],
        },
      },
      include: { itens: true },
    });

    return NextResponse.json(nota, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao salvar nota fiscal:', error);
    return NextResponse.json({ error: error.message || 'Erro ao salvar nota fiscal' }, { status: 500 });
  }
}
