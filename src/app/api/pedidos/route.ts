import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clienteId = searchParams.get('clienteId');
    const search = searchParams.get('search')?.trim() || '';

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (clienteId) {
      where.clienteId = clienteId;
    }
    if (search) {
      const num = parseInt(search, 10);
      if (!isNaN(num)) {
        where.OR = [
          { numero: num },
          { cliente: { nome: { contains: search } } },
          { cliente: { telefone: { contains: search } } },
        ];
      } else {
        where.cliente = {
          nome: { contains: search },
        };
      }
    }

    const pedidos = await prisma.pedido.findMany({
      where,
      orderBy: { data: 'desc' },
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
      },
    });

    return NextResponse.json(pedidos);
  } catch (error: any) {
    console.error('Erro ao listar pedidos:', error);
    return NextResponse.json({ error: error.message || 'Erro ao listar pedidos' }, { status: 500 });
  }
}

// Criação de Pedido com Movimentação Imediata de Estoque Transacional
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      clienteId,
      itens,
      desconto = 0,
      acrescimo = 0,
      observacoes,
      formaPagamento,
    } = body;

    if (!clienteId) {
      return NextResponse.json({ error: 'Cliente é obrigatório' }, { status: 400 });
    }

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({ error: 'O pedido deve conter pelo menos 1 item' }, { status: 400 });
    }

    // Execução da transação ACID rigorosa
    const novoPedido = await prisma.$transaction(async (tx) => {
      // 1. Gerar próximo número sequencial de pedido
      const ultimoPedido = await tx.pedido.findFirst({
        orderBy: { numero: 'desc' },
        select: { numero: true },
      });
      const proximoNumero = (ultimoPedido?.numero || 1000) + 1;

      // 2. Validar itens, preços e estoque
      let subtotalCalculado = 0;
      const itensValidados: {
        produtoId: string;
        nome: string;
        quantidade: number;
        valorUnitario: number;
        desconto: number;
        total: number;
        categoria: string;
      }[] = [];

      for (const item of itens) {
        const produto = await tx.produto.findUnique({
          where: { id: item.produtoId },
          include: { estoque: true },
        });

        if (!produto) {
          throw new Error(`Produto não encontrado (ID: ${item.produtoId})`);
        }

        const qtd = Number(item.quantidade);
        if (qtd <= 0) {
          throw new Error(`Quantidade inválida para o produto ${produto.nome}`);
        }

        const valorUnitario = Number(item.valorUnitario !== undefined ? item.valorUnitario : produto.precoVenda);
        const itemDesconto = Number(item.desconto || 0);
        const itemTotal = Number((qtd * valorUnitario - itemDesconto).toFixed(2));

        subtotalCalculado += itemTotal;

        itensValidados.push({
          produtoId: produto.id,
          nome: produto.nome,
          quantidade: qtd,
          valorUnitario,
          desconto: itemDesconto,
          total: itemTotal,
          categoria: produto.categoria,
        });

        // 3. Movimentação IMEDIATA de estoque de produto
        if (produto.estoque) {
          await tx.estoqueProduto.update({
            where: { produtoId: produto.id },
            data: {
              quantidadeAtual: { decrement: qtd },
            },
          });
        } else {
          await tx.estoqueProduto.create({
            data: {
              produtoId: produto.id,
              quantidadeAtual: -qtd,
              quantidadeMinima: 10,
            },
          });
        }
      }

      const totalFinal = Number((subtotalCalculado - Number(desconto) + Number(acrescimo)).toFixed(2));

      // 4. Criar o pedido
      const pedido = await tx.pedido.create({
        data: {
          numero: proximoNumero,
          clienteId,
          status: 'PENDENTE',
          formaPagamento: formaPagamento || null,
          subtotal: subtotalCalculado,
          desconto: Number(desconto),
          acrescimo: Number(acrescimo),
          total: totalFinal,
          observacoes: observacoes?.trim() || null,
          itens: {
            create: itensValidados.map((iv) => ({
              produtoId: iv.produtoId,
              quantidade: iv.quantidade,
              valorUnitario: iv.valorUnitario,
              desconto: iv.desconto,
              total: iv.total,
            })),
          },
        },
      });

      // 5. Movimentação de Garrafões para itens de Água 25L
      // Regra #38: Pedido de 25 águas -> Reduz 25 águas, Reduz 25 garrafões cheios, Aumenta 25 garrafões vazios
      const qtdTotalAgua = itensValidados
        .filter((iv) => iv.categoria === 'AGUA_25L')
        .reduce((acc, iv) => acc + iv.quantidade, 0);

      if (qtdTotalAgua > 0) {
        // Reduz garrafões cheios disponíveis (pega do lote mais antigo primeiro)
        let restanteParaDebitarCheios = qtdTotalAgua;
        const lotesCheios = await tx.estoqueGarrafao.findMany({
          where: { status: 'CHEIO', quantidade: { gt: 0 } },
          orderBy: { anoFabricacao: 'asc' },
        });

        for (const lote of lotesCheios) {
          if (restanteParaDebitarCheios <= 0) break;
          const aDebitar = Math.min(lote.quantidade, restanteParaDebitarCheios);
          await tx.estoqueGarrafao.update({
            where: { id: lote.id },
            data: { quantidade: { decrement: aDebitar } },
          });
          restanteParaDebitarCheios -= aDebitar;
        }

        // Se faltou lote específico com saldo, cria/atualiza lote base
        if (restanteParaDebitarCheios > 0) {
          let loteGenerico = await tx.estoqueGarrafao.findFirst({
            where: { status: 'CHEIO' },
          });
          if (loteGenerico) {
            await tx.estoqueGarrafao.update({
              where: { id: loteGenerico.id },
              data: { quantidade: { decrement: restanteParaDebitarCheios } },
            });
          } else {
            const anoAtual = new Date().getFullYear();
            await tx.estoqueGarrafao.create({
              data: {
                anoFabricacao: anoAtual,
                anoValidade: anoAtual + 3,
                quantidade: -restanteParaDebitarCheios,
                status: 'CHEIO',
                observacoes: 'Gerado automaticamente por movimentação de pedido',
              },
            });
          }
        }

        // Incrementa garrafões vazios devolvidos na troca
        const anoAtual = new Date().getFullYear();
        let loteVazio = await tx.estoqueGarrafao.findFirst({
          where: { status: 'VAZIO', anoFabricacao: anoAtual },
        });

        if (loteVazio) {
          await tx.estoqueGarrafao.update({
            where: { id: loteVazio.id },
            data: { quantidade: { increment: qtdTotalAgua } },
          });
        } else {
          // Pega qualquer lote vazio ou cria novo
          let outroLoteVazio = await tx.estoqueGarrafao.findFirst({
            where: { status: 'VAZIO' },
          });
          if (outroLoteVazio) {
            await tx.estoqueGarrafao.update({
              where: { id: outroLoteVazio.id },
              data: { quantidade: { increment: qtdTotalAgua } },
            });
          } else {
            await tx.estoqueGarrafao.create({
              data: {
                anoFabricacao: anoAtual,
                anoValidade: anoAtual + 3,
                quantidade: qtdTotalAgua,
                status: 'VAZIO',
                observacoes: 'Entrada de garrafões vazios na troca de pedidos',
              },
            });
          }
        }
      }

      // 6. Registrar auditoria da movimentação de cada produto vendido no pedido
      for (const iv of itensValidados) {
        await tx.movimentacaoEstoque.create({
          data: {
            tipo: 'SAIDA',
            quantidade: iv.quantidade,
            produtoId: iv.produtoId,
            motivo: `Saída de ${iv.quantidade} un de ${iv.nome} pelo Pedido #${pedido.numero}`,
            pedidoId: pedido.id,
          },
        });
      }

      return pedido;
    });

    const pedidoCompleto = await prisma.pedido.findUnique({
      where: { id: novoPedido.id },
      include: {
        cliente: true,
        itens: { include: { produto: true } },
      },
    });

    return NextResponse.json(pedidoCompleto, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar pedido:', error);
    return NextResponse.json({ error: error.message || 'Erro ao criar pedido' }, { status: 500 });
  }
}
