import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const TURSO_URL = 'libsql://agua-belle-db-tinywen.aws-us-east-1.turso.io';

function getPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || TURSO_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODczNTM1NDcsImlkIjoiMDFhMDI2OTItODUwMS03ZjcyLWJjM2YtNjkzZjIyYzM4MDdkIiwia2lkIjoiVmtXN1J0azMzX24yQ1ExbDdXemp4WEpxb2liZU1XajRFdnpLdlBHSTEtMCIsInJpZCI6IjY0NTIwMTc5LTI1YTQtNDUzZS1iY2E0LTM1NDliMGNlNzBiZCJ9.xniSY2b7Bq4cSGweN5sKyOOzKtC0N3X5s394A-TwcThgXiz-uZzZbIVlBGIhJPiHE5YeDgYpUhfMrsHpmRjqCA';

  // Forcar a definicao de DATABASE_URL no ambiente Node.js para o Prisma Engine nao reclamar
  process.env.DATABASE_URL = tursoUrl;

  if (tursoUrl && (tursoUrl.startsWith('libsql:') || tursoUrl.startsWith('https:'))) {
    try {
      const libsql = createClient({
        url: tursoUrl.trim(),
        authToken: authToken.trim(),
      });
      const adapter = new PrismaLibSql(libsql as any);
      return new PrismaClient({
        adapter,
        datasources: {
          db: {
            url: tursoUrl.trim(),
          },
        },
        log: ['error'],
      });
    } catch (err) {
      console.error('Erro ao conectar ao Turso Cloud:', err);
    }
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: 'file:./dev.db',
      },
    },
    log: ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
