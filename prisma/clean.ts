import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpando todos os dados do banco de dados Água Belle...');

  // 1. Limpar tabelas dependentes em ordem reversa
  await prisma.movimentacaoEstoque.deleteMany({});
  await prisma.notaFiscalItem.deleteMany({});
  await prisma.notaFiscal.deleteMany({});
  await prisma.despesa.deleteMany({});
  await prisma.boletoPagar.deleteMany({});
  await prisma.boletoParcela.deleteMany({});
  await prisma.boletoReceber.deleteMany({});
  await prisma.fiadoHistorico.deleteMany({});
  await prisma.fiado.deleteMany({});
  await prisma.pagamento.deleteMany({});
  await prisma.pedidoItem.deleteMany({});
  await prisma.pedido.deleteMany({});
  await prisma.estoqueGarrafao.deleteMany({});
  await prisma.estoqueProduto.deleteMany({});
  await prisma.produto.deleteMany({});
  await prisma.cliente.deleteMany({});

  // 2. Manter apenas a configuração básica da empresa e o usuário gestor
  await prisma.configuracao.upsert({
    where: { id: 'default' },
    update: {
      nomeEmpresa: 'Água Belle — Distribuidora de Água',
      cnpj: '',
      telefone: '',
      endereco: '',
      cidade: 'João Pessoa',
      estado: 'PB',
      chavePix: '',
    },
    create: {
      id: 'default',
      nomeEmpresa: 'Água Belle — Distribuidora de Água',
      cnpj: '',
      telefone: '',
      endereco: '',
      cidade: 'João Pessoa',
      estado: 'PB',
      chavePix: '',
    },
  });

  await prisma.user.upsert({
    where: { email: 'financeiro@aguabelle.com.br' },
    update: {},
    create: {
      nome: 'Responsável Financeiro',
      email: 'financeiro@aguabelle.com.br',
      senha: 'senha-segura-aguabelle',
    },
  });

  console.log('✨ Banco de dados zerado com sucesso! Pronto para cadastros reais.');
}

main()
  .catch((e) => {
    console.error('Erro ao zerar banco:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
