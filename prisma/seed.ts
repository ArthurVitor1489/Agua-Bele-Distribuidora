import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed do Banco de Dados Água Belle...');

  // 1. Configurações da Empresa
  await prisma.configuracao.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      nomeEmpresa: 'Água Belle — Distribuidora de Água',
      cnpj: '34.892.120/0001-45',
      telefone: '(83) 98765-4321',
      endereco: 'Rua das Fontes Cristalinas, 250 - Tambauzinho',
      cidade: 'João Pessoa',
      estado: 'PB',
      chavePix: 'financeiro@aguabelle.com.br',
    },
  });

  // 2. Usuário Operacional Único
  await prisma.user.upsert({
    where: { email: 'financeiro@aguabelle.com.br' },
    update: {},
    create: {
      nome: 'Responsável Financeiro',
      email: 'financeiro@aguabelle.com.br',
      senha: 'senha-segura-aguabelle',
    },
  });

  // 3. Produtos
  const produtoAgua = await prisma.produto.upsert({
    where: { id: 'prod-agua-25l' },
    update: {},
    create: {
      id: 'prod-agua-25l',
      nome: 'Água Mineral Galão 25 Litros',
      categoria: 'AGUA_25L',
      unidade: 'GL',
      precoVenda: 12.00,
      ativo: true,
      observacoes: 'Produto principal da Água Belle. Troca de galão vazio por cheio.',
    },
  });

  const produtoGarrafaoNovo = await prisma.produto.upsert({
    where: { id: 'prod-garrafao-novo' },
    update: {},
    create: {
      id: 'prod-garrafao-novo',
      nome: 'Garrafão 25L Novo (Vasilhame)',
      categoria: 'GARRAFAO_NOVO',
      unidade: 'UN',
      precoVenda: 35.00,
      ativo: true,
      observacoes: 'Vasilhame novo para primeiro pedido do cliente ou reposição.',
    },
  });

  const produtoSuporte = await prisma.produto.upsert({
    where: { id: 'prod-suporte-mesa' },
    update: {},
    create: {
      id: 'prod-suporte-mesa',
      nome: 'Suporte de Mesa com Torneira',
      categoria: 'SUPORTE',
      unidade: 'UN',
      precoVenda: 45.00,
      ativo: true,
      observacoes: 'Suporte em polipropileno para bancadas.',
    },
  });

  const produtoBomba = await prisma.produto.upsert({
    where: { id: 'prod-bomba-eletrica' },
    update: {},
    create: {
      id: 'prod-bomba-eletrica',
      nome: 'Bomba Elétrica Recarregável USB',
      categoria: 'BOMBA',
      unidade: 'UN',
      precoVenda: 55.00,
      ativo: true,
      observacoes: 'Bomba automática para galões de água.',
    },
  });

  // Estoque de Produtos
  await prisma.estoqueProduto.upsert({
    where: { produtoId: produtoAgua.id },
    update: { quantidadeAtual: 340, quantidadeMinima: 50 },
    create: { produtoId: produtoAgua.id, quantidadeAtual: 340, quantidadeMinima: 50 },
  });

  await prisma.estoqueProduto.upsert({
    where: { produtoId: produtoGarrafaoNovo.id },
    update: { quantidadeAtual: 45, quantidadeMinima: 15 },
    create: { produtoId: produtoGarrafaoNovo.id, quantidadeAtual: 45, quantidadeMinima: 15 },
  });

  await prisma.estoqueProduto.upsert({
    where: { produtoId: produtoSuporte.id },
    update: { quantidadeAtual: 20, quantidadeMinima: 5 },
    create: { produtoId: produtoSuporte.id, quantidadeAtual: 20, quantidadeMinima: 5 },
  });

  await prisma.estoqueProduto.upsert({
    where: { produtoId: produtoBomba.id },
    update: { quantidadeAtual: 18, quantidadeMinima: 5 },
    create: { produtoId: produtoBomba.id, quantidadeAtual: 18, quantidadeMinima: 5 },
  });

  // 4. Estoque de Garrafões por Lote/Ano e Validade (3 anos)
  // Limpar garrafões existentes para seed limpo
  await prisma.estoqueGarrafao.deleteMany({});

  await prisma.estoqueGarrafao.createMany({
    data: [
      {
        anoFabricacao: 2025,
        anoValidade: 2028,
        quantidade: 340,
        status: 'CHEIO',
        observacoes: 'Lote 2025 pronto para entrega',
      },
      {
        anoFabricacao: 2025,
        anoValidade: 2028,
        quantidade: 280,
        status: 'VAZIO',
        observacoes: 'Lote 2025 higienizados aguardando envase',
      },
      {
        anoFabricacao: 2026,
        anoValidade: 2029,
        quantidade: 150,
        status: 'DISPONIVEL',
        observacoes: 'Lote 2026 novos recebidos do fornecedor',
      },
      {
        anoFabricacao: 2024,
        anoValidade: 2027,
        quantidade: 12,
        status: 'DANIFICADO',
        observacoes: 'Rachadura leve no gargalo - triagem',
      },
      {
        anoFabricacao: 2024,
        anoValidade: 2027,
        quantidade: 6,
        status: 'QUEBRADO',
        observacoes: 'Queda durante descarregamento',
      },
      {
        anoFabricacao: 2023,
        anoValidade: 2026,
        quantidade: 10,
        status: 'VENCIDO',
        observacoes: 'Atingiu prazo limite de 3 anos',
      },
      {
        anoFabricacao: 2023,
        anoValidade: 2026,
        quantidade: 8,
        status: 'DESCARTADO',
        observacoes: 'Destinado a reciclagem homologada',
      },
    ],
  });

  // 5. Clientes
  const cliente1 = await prisma.cliente.upsert({
    where: { id: 'cli-arthur' },
    update: {},
    create: {
      id: 'cli-arthur',
      nome: 'Arthur Vitor Consultoria ME',
      cpfCnpj: '18.234.567/0001-89',
      telefone: '(83) 98888-1111',
      whatsapp: '(83) 98888-1111',
      email: 'arthur@consultoria.com.br',
      cep: '58038-000',
      logradouro: 'Av. Epitácio Pessoa',
      numero: '1200',
      complemento: 'Sala 402',
      bairro: 'Estados',
      cidade: 'João Pessoa',
      estado: 'PB',
      pontoReferencia: 'Próximo ao Extra Supermercados',
      ativo: true,
    },
  });

  const cliente2 = await prisma.cliente.upsert({
    where: { id: 'cli-restaurante-mar' },
    update: {},
    create: {
      id: 'cli-restaurante-mar',
      nome: 'Restaurante Sabor do Mar',
      cpfCnpj: '24.111.222/0001-33',
      telefone: '(83) 99999-2222',
      whatsapp: '(83) 99999-2222',
      email: 'financeiro@sabordomar.com.br',
      cep: '58045-100',
      logradouro: 'Av. Cabo Branco',
      numero: '2500',
      complemento: '',
      bairro: 'Cabo Branco',
      cidade: 'João Pessoa',
      estado: 'PB',
      pontoReferencia: 'Em frente ao quiosque 12',
      ativo: true,
    },
  });

  const cliente3 = await prisma.cliente.upsert({
    where: { id: 'cli-clinica-vida' },
    update: {},
    create: {
      id: 'cli-clinica-vida',
      nome: 'Clínica Saúde & Vida',
      cpfCnpj: '09.876.543/0001-21',
      telefone: '(83) 97777-3333',
      whatsapp: '(83) 97777-3333',
      email: 'compras@saudevida.med.br',
      cep: '58040-020',
      logradouro: 'Rua Bento da Gama',
      numero: '310',
      complemento: 'Térreo',
      bairro: 'Torre',
      cidade: 'João Pessoa',
      estado: 'PB',
      pontoReferencia: 'Atrás do Hospital da Unimed',
      ativo: true,
    },
  });

  const cliente4 = await prisma.cliente.upsert({
    where: { id: 'cli-dona-maria' },
    update: {},
    create: {
      id: 'cli-dona-maria',
      nome: 'Maria da Silva (Residencial)',
      cpfCnpj: '123.456.789-00',
      telefone: '(83) 98822-4444',
      whatsapp: '(83) 98822-4444',
      email: 'mariasilva@gmail.com',
      cep: '58030-000',
      logradouro: 'Rua Manoel Morais',
      numero: '45',
      complemento: 'Apto 102',
      bairro: 'Manaíra',
      cidade: 'João Pessoa',
      estado: 'PB',
      pontoReferencia: 'Próximo à Praça Silvio Porto',
      ativo: true,
    },
  });

  // 6. Pedidos, Itens, Pagamentos e Financeiro (Casos reais demonstrando regras)

  // Pedido 1001: Entregue, Pago via PIX (R$ 300,00)
  const ped1 = await prisma.pedido.upsert({
    where: { numero: 1001 },
    update: {},
    create: {
      numero: 1001,
      clienteId: cliente1.id,
      status: 'ENTREGUE',
      formaPagamento: 'PIX',
      subtotal: 300.00,
      desconto: 0,
      acrescimo: 0,
      total: 300.00,
      observacoes: 'Entrega realizada no 4º andar pela manhã.',
      itens: {
        create: [
          {
            produtoId: produtoAgua.id,
            quantidade: 25,
            valorUnitario: 12.00,
            total: 300.00,
          },
        ],
      },
      pagamentos: {
        create: [
          {
            forma: 'PIX',
            valor: 300.00,
            observacoes: 'Chave Pix confirmada no ato da entrega',
          },
        ],
      },
    },
  });

  // Pedido 1002: Fiado (Restaurante Sabor do Mar - 50 águas = R$ 600,00, pagou R$ 200, resta R$ 400)
  const ped2 = await prisma.pedido.upsert({
    where: { numero: 1002 },
    update: {},
    create: {
      numero: 1002,
      clienteId: cliente2.id,
      status: 'ENTREGUE',
      formaPagamento: 'FIADO',
      subtotal: 600.00,
      desconto: 0,
      acrescimo: 0,
      total: 600.00,
      observacoes: 'Acerto quinzenal com o gerente Paulo.',
      itens: {
        create: [
          {
            produtoId: produtoAgua.id,
            quantidade: 50,
            valorUnitario: 12.00,
            total: 600.00,
          },
        ],
      },
      fiado: {
        create: {
          clienteId: cliente2.id,
          valorOriginal: 600.00,
          valorPago: 200.00,
          saldo: 400.00,
          situacao: 'PARCIAL',
          historico: {
            create: [
              {
                valorPago: 200.00,
                formaPagamento: 'PIX',
                observacoes: 'Adiantamento na entrega',
              },
            ],
          },
        },
      },
    },
  });

  // Pedido 1003: Boleto a Receber (Clínica Saúde & Vida - 40 águas + 1 bomba = R$ 535,00 em 2 parcelas)
  const ped3 = await prisma.pedido.upsert({
    where: { numero: 1003 },
    update: {},
    create: {
      numero: 1003,
      clienteId: cliente3.id,
      status: 'ENTREGUE',
      formaPagamento: 'BOLETO',
      subtotal: 535.00,
      desconto: 0,
      acrescimo: 0,
      total: 535.00,
      observacoes: 'Faturamento corporativo em 2x.',
      itens: {
        create: [
          {
            produtoId: produtoAgua.id,
            quantidade: 40,
            valorUnitario: 12.00,
            total: 480.00,
          },
          {
            produtoId: produtoBomba.id,
            quantidade: 1,
            valorUnitario: 55.00,
            total: 55.00,
          },
        ],
      },
      boletoReceber: {
        create: {
          clienteId: cliente3.id,
          numero: 'BOL-2026-089',
          quantidadeParcelas: 2,
          valorTotal: 535.00,
          parcelas: {
            create: [
              {
                numeroParcela: 1,
                valor: 267.50,
                dataVencimento: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                dataPagamento: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                status: 'PAGA',
              },
              {
                numeroParcela: 2,
                valor: 267.50,
                dataVencimento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                status: 'PENDENTE',
              },
            ],
          },
        },
      },
    },
  });

  // Pedido 1004: Pendente recente (Dona Maria - 3 águas, pagamento a definir quando responsável abrir)
  const ped4 = await prisma.pedido.upsert({
    where: { numero: 1004 },
    update: {},
    create: {
      numero: 1004,
      clienteId: cliente4.id,
      status: 'PENDENTE',
      formaPagamento: null, // Forma de pagamento NÃO precisa ser definida na criação
      subtotal: 36.00,
      desconto: 0,
      acrescimo: 0,
      total: 36.00,
      observacoes: 'Tocar o interfone do 102. Entregar à tarde.',
      itens: {
        create: [
          {
            produtoId: produtoAgua.id,
            quantidade: 3,
            valorUnitario: 12.00,
            total: 36.00,
          },
        ],
      },
    },
  });

  // 7. Despesas Operacionais e Boletos a Pagar
  await prisma.despesa.createMany({
    data: [
      {
        categoria: 'COMBUSTIVEL',
        descricao: 'Abastecimento Caminhão de Entrega Iveco Daily (Diesel S10)',
        valor: 350.00,
        data: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        formaPagamento: 'DEBITO',
        status: 'PAGA',
        observacoes: 'Posto Petrobras Beira Rio',
      },
      {
        categoria: 'MANUTENCAO',
        descricao: 'Troca de pastilhas de freio da van de entrega',
        valor: 280.00,
        data: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        formaPagamento: 'PIX',
        status: 'PAGA',
        observacoes: 'Auto Mecânica Express',
      },
      {
        categoria: 'CONTAS_FIXAS',
        descricao: 'Energia Elétrica Depósito / Bombeamento',
        valor: 620.00,
        data: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        formaPagamento: 'BOLETO',
        status: 'PENDENTE',
        observacoes: 'Energisa Paraíba - Vencimento próximo',
      },
    ],
  });

  // 8. Notas Fiscais
  await prisma.notaFiscal.create({
    data: {
      numero: '000.014.520',
      serie: '1',
      dataEmissao: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      emissorNome: 'Fonte Águas Puras do Nordeste Ltda',
      emissorCnpj: '08.921.345/0001-12',
      chaveAcesso: '25260808921345000112550010000145201987654321',
      valorTotal: 1850.00,
      valorIcms: 222.00,
      valorPis: 30.52,
      valorCofins: 140.60,
      outrosTributos: 0,
      observacoes: 'Nota fiscal de compra de insumos e tampas para galões.',
      itens: {
        create: [
          {
            descricao: 'Tampa de vedação anti-violação 25L (Pacote 1000 un)',
            quantidade: 2,
            valorUnitario: 425.00,
            valorTotal: 850.00,
          },
          {
            descricao: 'Rótulo adesivo oficial Água Belle (Milheiro)',
            quantidade: 2,
            valorUnitario: 500.00,
            valorTotal: 1000.00,
          },
        ],
      },
    },
  });

  console.log('✅ Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
