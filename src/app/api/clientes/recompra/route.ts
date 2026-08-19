import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({
      where: { ativo: true },
      include: {
        pedidos: {
          where: { status: { not: 'CANCELADO' } },
          orderBy: { data: 'desc' },
          select: { id: true, numero: true, data: true, total: true },
        },
      },
      orderBy: { nome: 'asc' },
    });

    const agora = new Date();

    const oportunidadesRecompra = [];

    for (const c of clientes) {
      if (!c.pedidos || c.pedidos.length === 0) continue;

      const ultimoPedido = c.pedidos[0];
      const dataUltimoPedido = new Date(ultimoPedido.data);
      const diffMs = agora.getTime() - dataUltimoPedido.getTime();
      const diasSemComprar = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let intervaloMedioDias = 15; // Padrão se tiver apenas 1 pedido

      if (c.pedidos.length >= 2) {
        // Calcular intervalo médio histórico entre os pedidos
        let somaIntervalos = 0;
        for (let i = 0; i < c.pedidos.length - 1; i++) {
          const p1 = new Date(c.pedidos[i].data);
          const p2 = new Date(c.pedidos[i + 1].data);
          const diff = Math.floor((p1.getTime() - p2.getTime()) / (1000 * 60 * 60 * 24));
          somaIntervalos += Math.max(1, diff);
        }
        intervaloMedioDias = Math.round(somaIntervalos / (c.pedidos.length - 1));
      }

      // Alerta se o número de dias sem comprar for maior ou igual ao intervalo habitual (ou >= 15 dias)
      const diasAtraso = diasSemComprar - intervaloMedioDias;

      if (diasSemComprar >= 10 && (diasSemComprar >= intervaloMedioDias || c.pedidos.length === 1)) {
        oportunidadesRecompra.push({
          clienteId: c.id,
          nome: c.nome,
          telefone: c.telefone,
          whatsapp: c.whatsapp,
          bairro: c.bairro,
          cidade: c.cidade,
          logradouro: c.logradouro,
          numero: c.numero,
          totalPedidos: c.pedidos.length,
          ultimoPedidoData: ultimoPedido.data,
          diasSemComprar,
          intervaloMedioDias,
          diasAtraso: Math.max(0, diasAtraso),
          urgencia: diasAtraso >= 7 ? 'ALTA' : diasAtraso >= 3 ? 'MEDIA' : 'NORMAL',
        });
      }
    }

    // Ordenar por urgência e maior tempo de atraso
    oportunidadesRecompra.sort((a, b) => b.diasSemComprar - a.diasSemComprar);

    return NextResponse.json({
      totalOportunidades: oportunidadesRecompra.length,
      clientes: oportunidadesRecompra,
    });
  } catch (error: any) {
    console.error('Erro ao buscar alertas de recompra:', error);
    return NextResponse.json({ error: error.message || 'Erro ao calcular pós-venda' }, { status: 500 });
  }
}
