import { createClient } from '@libsql/client';
import { gerarBackupCompleto } from '../src/lib/backup';
import { hashPassword } from '../src/lib/auth';

const url = 'libsql://agua-belle-db-tinywen.aws-us-east-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODczNTM1NDcsImlkIjoiMDFhMDI2OTItODUwMS03ZjcyLWJjM2YtNjkzZjIyYzM4MDdkIiwia2lkIjoiVmtXN1J0azMzX24yQ1ExbDdXemp4WEpxb2liZU1XajRFdnpLdlBHSTEtMCIsInJpZCI6IjY0NTIwMTc5LTI1YTQtNDUzZS1iY2E0LTM1NDliMGNlNzBiZCJ9.xniSY2b7Bq4cSGweN5sKyOOzKtC0N3X5s394A-TwcThgXiz-uZzZbIVlBGIhJPiHE5YeDgYpUhfMrsHpmRjqCA';

async function syncTurso() {
  console.log('Conectando ao banco de dados Turso na nuvem...');
  const client = createClient({ url, authToken });

  const statements = [
    `CREATE TABLE IF NOT EXISTS "Configuracao" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
      "nomeEmpresa" TEXT DEFAULT '',
      "cnpj" TEXT DEFAULT '',
      "inscricaoEstadual" TEXT DEFAULT '',
      "telefone" TEXT DEFAULT '',
      "endereco" TEXT DEFAULT '',
      "cidade" TEXT DEFAULT '',
      "estado" TEXT DEFAULT '',
      "chavePix" TEXT DEFAULT '',
      "updatedAt" DATETIME NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "nome" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "senha" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "Cliente" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "nome" TEXT NOT NULL,
      "cpfCnpj" TEXT,
      "telefone" TEXT,
      "whatsapp" TEXT,
      "email" TEXT,
      "cep" TEXT,
      "logradouro" TEXT,
      "numero" TEXT,
      "complemento" TEXT,
      "bairro" TEXT,
      "cidade" TEXT,
      "estado" TEXT,
      "pontoReferencia" TEXT,
      "observacoes" TEXT,
      "ativo" BOOLEAN NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "Produto" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "nome" TEXT NOT NULL,
      "categoria" TEXT NOT NULL DEFAULT 'AGUA_20L',
      "unidade" TEXT NOT NULL DEFAULT 'UN',
      "precoVenda" REAL NOT NULL,
      "ativo" BOOLEAN NOT NULL DEFAULT 1,
      "observacoes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "ClientePrecoProduto" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "clienteId" TEXT NOT NULL,
      "produtoId" TEXT NOT NULL,
      "preco" REAL NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      UNIQUE("clienteId", "produtoId")
    );`,
    `CREATE TABLE IF NOT EXISTS "EstoqueProduto" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "produtoId" TEXT NOT NULL UNIQUE,
      "quantidadeAtual" INTEGER NOT NULL DEFAULT 0,
      "quantidadeMinima" INTEGER NOT NULL DEFAULT 10,
      "updatedAt" DATETIME NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "EstoqueGarrafao" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "anoFabricacao" INTEGER NOT NULL,
      "anoValidade" INTEGER NOT NULL,
      "quantidade" INTEGER NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'DISPONIVEL',
      "observacoes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "MovimentacaoEstoque" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tipo" TEXT NOT NULL,
      "quantidade" INTEGER NOT NULL,
      "produtoId" TEXT,
      "estoqueGarrafaoId" TEXT,
      "motivo" TEXT,
      "pedidoId" TEXT,
      "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "Pedido" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "numero" INTEGER NOT NULL UNIQUE,
      "clienteId" TEXT NOT NULL,
      "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "status" TEXT NOT NULL DEFAULT 'PENDENTE',
      "formaPagamento" TEXT,
      "subtotal" REAL NOT NULL DEFAULT 0,
      "desconto" REAL NOT NULL DEFAULT 0,
      "acrescimo" REAL NOT NULL DEFAULT 0,
      "total" REAL NOT NULL DEFAULT 0,
      "observacoes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "PedidoItem" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "pedidoId" TEXT NOT NULL,
      "produtoId" TEXT NOT NULL,
      "quantidade" INTEGER NOT NULL,
      "valorUnitario" REAL NOT NULL,
      "desconto" REAL NOT NULL DEFAULT 0,
      "total" REAL NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "Pagamento" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "pedidoId" TEXT NOT NULL,
      "forma" TEXT NOT NULL,
      "valor" REAL NOT NULL,
      "dataPagamento" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "observacoes" TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS "Fiado" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "pedidoId" TEXT NOT NULL UNIQUE,
      "clienteId" TEXT NOT NULL,
      "valorOriginal" REAL NOT NULL,
      "valorPago" REAL NOT NULL DEFAULT 0,
      "saldo" REAL NOT NULL,
      "situacao" TEXT NOT NULL DEFAULT 'ABERTO',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "FiadoHistorico" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "fiadoId" TEXT NOT NULL,
      "valorPago" REAL NOT NULL,
      "dataPagamento" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "formaPagamento" TEXT NOT NULL,
      "observacoes" TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS "BoletoReceber" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "pedidoId" TEXT NOT NULL UNIQUE,
      "clienteId" TEXT NOT NULL,
      "numero" TEXT NOT NULL,
      "quantidadeParcelas" INTEGER NOT NULL,
      "valorTotal" REAL NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "BoletoParcela" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "boletoReceberId" TEXT NOT NULL,
      "numeroParcela" INTEGER NOT NULL,
      "valor" REAL NOT NULL,
      "dataVencimento" DATETIME NOT NULL,
      "dataPagamento" DATETIME,
      "status" TEXT NOT NULL DEFAULT 'PENDENTE'
    );`,
    `CREATE TABLE IF NOT EXISTS "Despesa" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "categoria" TEXT NOT NULL,
      "descricao" TEXT NOT NULL,
      "valor" REAL NOT NULL,
      "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "formaPagamento" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PAGA',
      "observacoes" TEXT,
      "boletoPagarId" TEXT UNIQUE,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "BoletoPagar" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "fornecedor" TEXT NOT NULL,
      "numero" TEXT NOT NULL,
      "valor" REAL NOT NULL,
      "dataVencimento" DATETIME NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDENTE',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "NotaFiscal" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "numero" TEXT NOT NULL,
      "serie" TEXT,
      "dataEmissao" DATETIME NOT NULL,
      "emissorNome" TEXT NOT NULL,
      "emissorCnpj" TEXT NOT NULL,
      "chaveAcesso" TEXT,
      "valorTotal" REAL NOT NULL,
      "valorIcms" REAL NOT NULL DEFAULT 0,
      "valorPis" REAL NOT NULL DEFAULT 0,
      "valorCofins" REAL NOT NULL DEFAULT 0,
      "outrosTributos" REAL NOT NULL DEFAULT 0,
      "arquivoUrl" TEXT,
      "observacoes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "NotaFiscalItem" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "notaFiscalId" TEXT NOT NULL,
      "descricao" TEXT NOT NULL,
      "quantidade" REAL NOT NULL,
      "valorUnitario" REAL NOT NULL,
      "valorTotal" REAL NOT NULL
    );`,
  ];

  for (const sql of statements) {
    await client.execute(sql);
  }

  console.log('Todas as 19 tabelas criadas com sucesso no Turso!');

  // Inserir configuracao oficial se nao existir
  await client.execute({
    sql: `INSERT OR REPLACE INTO "Configuracao" (id, nomeEmpresa, cnpj, telefone, endereco, cidade, estado, chavePix, updatedAt)
          VALUES ('default', 'Aguabelle - Fabricação e Comércio de Águas Ltda', '34.194.297/0001-95', '+55 83 9177-5672', 'Rua José Firmino da Silva 1415', 'Jardim Paulistano - CEP: 58415-245', 'PB', '34.194.297/0001-95', CURRENT_TIMESTAMP);`,
    args: [],
  });

  // Inserir usuario admin padrao
  const hashSenha = await hashPassword('123456');
  await client.execute({
    sql: `INSERT OR REPLACE INTO "User" (id, nome, email, senha, createdAt, updatedAt)
          VALUES ('admin-id-default', 'Administrador', 'admin@aguabelle.com.br', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
    args: [hashSenha],
  });

  console.log('Configuração e Usuário Admin inicializados com sucesso no Turso na Nuvem!');
}

syncTurso().catch(console.error);
