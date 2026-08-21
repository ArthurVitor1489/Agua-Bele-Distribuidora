import { prisma } from '@/lib/prisma';

export interface BackupPayload {
  versao: string;
  dataGeracao: string;
  sistema: string;
  resumo?: {
    totalClientes: number;
    totalProdutos: number;
    totalPedidos: number;
    totalGarrafoes: number;
    totalMovimentacoes: number;
    totalDespesas: number;
    totalNotasFiscais: number;
    totalBoletos: number;
    totalPrecosEspeciais?: number;
  };
  tabelas: {
    configuracao: any[];
    user: any[];
    clientes: any[];
    precosEspeciais?: any[];
    produtos: any[];
    estoqueProdutos: any[];
    estoqueGarrafoes: any[];
    pedidos: any[];
    pedidoItens: any[];
    pagamentos: any[];
    fiados: any[];
    fiadoHistorico: any[];
    boletosReceber: any[];
    boletosParcelas: any[];
    despesas: any[];
    boletosPagar: any[];
    notasFiscais: any[];
    notaFiscalItens: any[];
    movimentacoesEstoque: any[];
  };
}

export async function gerarBackupCompleto(): Promise<BackupPayload> {
  const [
    configuracao,
    user,
    clientes,
    precosEspeciais,
    produtos,
    estoqueProdutos,
    estoqueGarrafoes,
    pedidos,
    pedidoItens,
    pagamentos,
    fiados,
    fiadoHistorico,
    boletosReceber,
    boletosParcelas,
    despesas,
    boletosPagar,
    notasFiscais,
    notaFiscalItens,
    movimentacoesEstoque,
  ] = await Promise.all([
    prisma.configuracao.findMany(),
    prisma.user.findMany(),
    prisma.cliente.findMany(),
    prisma.clientePrecoProduto.findMany(),
    prisma.produto.findMany(),
    prisma.estoqueProduto.findMany(),
    prisma.estoqueGarrafao.findMany(),
    prisma.pedido.findMany(),
    prisma.pedidoItem.findMany(),
    prisma.pagamento.findMany(),
    prisma.fiado.findMany(),
    prisma.fiadoHistorico.findMany(),
    prisma.boletoReceber.findMany(),
    prisma.boletoParcela.findMany(),
    prisma.despesa.findMany(),
    prisma.boletoPagar.findMany(),
    prisma.notaFiscal.findMany(),
    prisma.notaFiscalItem.findMany(),
    prisma.movimentacaoEstoque.findMany(),
  ]);

  return {
    versao: '1.0.0',
    dataGeracao: new Date().toISOString(),
    sistema: 'Água Belle — Gestão V1',
    resumo: {
      totalClientes: clientes.length,
      totalProdutos: produtos.length,
      totalPedidos: pedidos.length,
      totalGarrafoes: estoqueGarrafoes.length,
      totalMovimentacoes: movimentacoesEstoque.length,
      totalDespesas: despesas.length,
      totalNotasFiscais: notasFiscais.length,
      totalBoletos: boletosReceber.length + boletosPagar.length,
      totalPrecosEspeciais: precosEspeciais.length,
    },
    tabelas: {
      configuracao,
      user,
      clientes,
      precosEspeciais,
      produtos,
      estoqueProdutos,
      estoqueGarrafoes,
      pedidos,
      pedidoItens,
      pagamentos,
      fiados,
      fiadoHistorico,
      boletosReceber,
      boletosParcelas,
      despesas,
      boletosPagar,
      notasFiscais,
      notaFiscalItens,
      movimentacoesEstoque,
    },
  };
}

export async function restaurarBackup(backup: BackupPayload): Promise<{ sucesso: boolean; mensagem: string }> {
  if (!backup.tabelas || !backup.sistema) {
    throw new Error('Arquivo de backup inválido ou corrompido.');
  }

  // Executa restauração dentro de uma transação completa
  await prisma.$transaction(async (tx) => {
    // 1. Limpar tabelas em ordem inversa de dependência
    await tx.movimentacaoEstoque.deleteMany({});
    await tx.notaFiscalItem.deleteMany({});
    await tx.notaFiscal.deleteMany({});
    await tx.despesa.deleteMany({});
    await tx.boletoPagar.deleteMany({});
    await tx.boletoParcela.deleteMany({});
    await tx.boletoReceber.deleteMany({});
    await tx.fiadoHistorico.deleteMany({});
    await tx.fiado.deleteMany({});
    await tx.pagamento.deleteMany({});
    await tx.pedidoItem.deleteMany({});
    await tx.pedido.deleteMany({});
    await tx.estoqueGarrafao.deleteMany({});
    await tx.estoqueProduto.deleteMany({});
    await tx.clientePrecoProduto.deleteMany({});
    await tx.produto.deleteMany({});
    await tx.cliente.deleteMany({});
    await tx.user.deleteMany({});
    await tx.configuracao.deleteMany({});

    // 2. Restaurar tabelas respeitando chaves estrangeiras

    // 2.1 Configuração do Sistema
    if (backup.tabelas.configuracao?.length) {
      for (const item of backup.tabelas.configuracao) {
        await tx.configuracao.create({ data: item });
      }
    }

    // 2.2 Usuários
    if (backup.tabelas.user?.length) {
      for (const item of backup.tabelas.user) {
        await tx.user.create({
          data: {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
        });
      }
    }

    // 2.3 Clientes
    if (backup.tabelas.clientes?.length) {
      for (const item of backup.tabelas.clientes) {
        await tx.cliente.create({
          data: {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
        });
      }
    }

    // 2.4 Produtos & Catálogo
    if (backup.tabelas.produtos?.length) {
      for (const item of backup.tabelas.produtos) {
        await tx.produto.create({
          data: {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
        });
      }
    }

    // 2.4.1 Preços Especiais por Cliente
    if (backup.tabelas.precosEspeciais?.length) {
      for (const item of backup.tabelas.precosEspeciais) {
        await tx.clientePrecoProduto.create({
          data: {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
        });
      }
    }

    // 2.5 Estoque de Produtos
    if (backup.tabelas.estoqueProdutos?.length) {
      for (const item of backup.tabelas.estoqueProdutos) {
        await tx.estoqueProduto.create({
          data: {
            ...item,
            updatedAt: new Date(item.updatedAt),
          },
        });
      }
    }

    // 2.6 Vasilhames & Garrafões
    if (backup.tabelas.estoqueGarrafoes?.length) {
      for (const item of backup.tabelas.estoqueGarrafoes) {
        await tx.estoqueGarrafao.create({
          data: {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
        });
      }
    }

    // 2.7 Pedidos
    if (backup.tabelas.pedidos?.length) {
      for (const item of backup.tabelas.pedidos) {
        await tx.pedido.create({
          data: {
            ...item,
            data: new Date(item.data),
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
        });
      }
    }

    // 2.8 Itens dos Pedidos
    if (backup.tabelas.pedidoItens?.length) {
      for (const item of backup.tabelas.pedidoItens) {
        await tx.pedidoItem.create({ data: item });
      }
    }

    // 2.9 Pagamentos
    if (backup.tabelas.pagamentos?.length) {
      for (const item of backup.tabelas.pagamentos) {
        await tx.pagamento.create({
          data: {
            ...item,
            dataPagamento: new Date(item.dataPagamento),
          },
        });
      }
    }

    // 2.10 Fiados
    if (backup.tabelas.fiados?.length) {
      for (const item of backup.tabelas.fiados) {
        await tx.fiado.create({
          data: {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
        });
      }
    }

    // 2.11 Histórico de Pagamento de Fiados
    if (backup.tabelas.fiadoHistorico?.length) {
      for (const item of backup.tabelas.fiadoHistorico) {
        await tx.fiadoHistorico.create({
          data: {
            ...item,
            dataPagamento: new Date(item.dataPagamento),
          },
        });
      }
    }

    // 2.12 Boletos a Receber
    if (backup.tabelas.boletosReceber?.length) {
      for (const item of backup.tabelas.boletosReceber) {
        await tx.boletoReceber.create({
          data: {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
        });
      }
    }

    // 2.13 Parcelas de Boletos a Receber
    if (backup.tabelas.boletosParcelas?.length) {
      for (const item of backup.tabelas.boletosParcelas) {
        await tx.boletoParcela.create({
          data: {
            ...item,
            dataVencimento: new Date(item.dataVencimento),
            dataPagamento: item.dataPagamento ? new Date(item.dataPagamento) : null,
          },
        });
      }
    }

    // 2.14 Boletos a Pagar (Fornecedores)
    if (backup.tabelas.boletosPagar?.length) {
      for (const item of backup.tabelas.boletosPagar) {
        await tx.boletoPagar.create({
          data: {
            ...item,
            dataVencimento: new Date(item.dataVencimento),
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
        });
      }
    }

    // 2.15 Despesas Operacionais
    if (backup.tabelas.despesas?.length) {
      for (const item of backup.tabelas.despesas) {
        await tx.despesa.create({
          data: {
            ...item,
            data: new Date(item.data),
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
        });
      }
    }

    // 2.16 Notas Fiscais (Cabecalho)
    if (backup.tabelas.notasFiscais?.length) {
      for (const item of backup.tabelas.notasFiscais) {
        await tx.notaFiscal.create({
          data: {
            ...item,
            dataEmissao: new Date(item.dataEmissao),
            createdAt: new Date(item.createdAt),
          },
        });
      }
    }

    // 2.17 Itens de Notas Fiscais
    if (backup.tabelas.notaFiscalItens?.length) {
      for (const item of backup.tabelas.notaFiscalItens) {
        await tx.notaFiscalItem.create({ data: item });
      }
    }

    // 2.18 Histórico & Auditoria de Movimentações de Estoque
    if (backup.tabelas.movimentacoesEstoque?.length) {
      for (const item of backup.tabelas.movimentacoesEstoque) {
        await tx.movimentacaoEstoque.create({
          data: {
            ...item,
            data: new Date(item.data),
          },
        });
      }
    }
  });

  return { sucesso: true, mensagem: 'Dados restaurados com sucesso!' };
}
