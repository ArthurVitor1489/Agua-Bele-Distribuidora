import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        pedidos: {
          orderBy: { data: 'desc' },
          take: 10,
          include: { itens: { include: { produto: true } } },
        },
        fiados: {
          include: { historico: true, pedido: true },
        },
        boletos: {
          include: { parcelas: true, pedido: true },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    return NextResponse.json(cliente);
  } catch (error: any) {
    console.error('Erro ao buscar cliente:', error);
    return NextResponse.json({ error: error.message || 'Erro ao buscar cliente' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        nome: body.nome?.trim(),
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
        ativo: body.ativo !== undefined ? Boolean(body.ativo) : undefined,
      },
    });

    return NextResponse.json(cliente);
  } catch (error: any) {
    console.error('Erro ao atualizar cliente:', error);
    return NextResponse.json({ error: error.message || 'Erro ao atualizar cliente' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.cliente.delete({
      where: { id },
    });

    return NextResponse.json({ sucesso: true });
  } catch (error: any) {
    console.error('Erro ao excluir cliente:', error);
    return NextResponse.json({ error: error.message || 'Erro ao excluir cliente' }, { status: 500 });
  }
}
