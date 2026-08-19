import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        cliente: true,
        itens: {
          include: { produto: true },
        },
        pagamentos: true,
        fiado: {
          include: { historico: true },
        },
        boletoReceber: {
          include: { parcelas: true },
        },
        movimentacoes: true,
      },
    });

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    return NextResponse.json(pedido);
  } catch (error: any) {
    console.error('Erro ao buscar pedido:', error);
    return NextResponse.json({ error: error.message || 'Erro ao buscar pedido' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.pedido.delete({
      where: { id },
    });

    return NextResponse.json({ sucesso: true });
  } catch (error: any) {
    console.error('Erro ao excluir pedido:', error);
    return NextResponse.json({ error: error.message || 'Erro ao excluir pedido' }, { status: 500 });
  }
}
