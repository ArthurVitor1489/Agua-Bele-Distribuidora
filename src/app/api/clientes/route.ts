import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const ativo = searchParams.get('ativo');

    const where: any = {};

    if (ativo !== null && ativo !== undefined && ativo !== '') {
      where.ativo = ativo === 'true';
    }

    if (search) {
      where.OR = [
        { nome: { contains: search } },
        { cpfCnpj: { contains: search } },
        { telefone: { contains: search } },
        { whatsapp: { contains: search } },
        { email: { contains: search } },
        { bairro: { contains: search } },
        { cidade: { contains: search } },
      ];
    }

    const clientes = await prisma.cliente.findMany({
      where,
      orderBy: { nome: 'asc' },
      include: {
        _count: {
          select: { pedidos: true, fiados: true, boletos: true },
        },
      },
    });

    return NextResponse.json(clientes);
  } catch (error: any) {
    console.error('Erro ao listar clientes:', error);
    return NextResponse.json({ error: error.message || 'Erro ao listar clientes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.nome || body.nome.trim() === '') {
      return NextResponse.json({ error: 'Nome do cliente é obrigatório' }, { status: 400 });
    }

    const cliente = await prisma.cliente.create({
      data: {
        nome: body.nome.trim(),
        cpfCnpj: body.cpfCnpj?.trim() || null,
        telefone: body.telefone?.trim() || null,
        whatsapp: body.whatsapp?.trim() || null,
        email: body.email?.trim() || null,
        cep: body.cep?.trim() || null,
        logradouro: body.logradouro?.trim() || null,
        numero: body.numero?.trim() || null,
        complemento: body.complemento?.trim() || null,
        bairro: body.bairro?.trim() || null,
        cidade: body.cidade?.trim() || null,
        estado: body.estado?.trim() || 'PB',
        pontoReferencia: body.pontoReferencia?.trim() || null,
        observacoes: body.observacoes?.trim() || null,
        ativo: body.ativo !== undefined ? Boolean(body.ativo) : true,
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json({ error: error.message || 'Erro ao criar cliente' }, { status: 500 });
  }
}
