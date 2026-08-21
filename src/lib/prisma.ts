import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const TURSO_URL = 'libsql://agua-belle-db-tinywen.aws-us-east-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODczNTM1NDcsImlkIjoiMDFhMDI2OTItODUwMS03ZjcyLWJjM2YtNjkzZjIyYzM4MDdkIiwia2lkIjoiVmtXN1J0azMzX24yQ1ExbDdXemp4WEpxb2liZU1XajRFdnpLdlBHSTEtMCIsInJpZCI6IjY0NTIwMTc5LTI1YTQtNDUzZS1iY2E0LTM1NDliMGNlNzBiZCJ9.xniSY2b7Bq4cSGweN5sKyOOzKtC0N3X5s394A-TwcThgXiz-uZzZbIVlBGIhJPiHE5YeDgYpUhfMrsHpmRjqCA';

function getPrismaClient(): PrismaClient {
  const url = (process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || TURSO_URL).trim();
  const authToken = (process.env.TURSO_AUTH_TOKEN || TURSO_TOKEN).trim();

  if (url && (url.startsWith('libsql:') || url.startsWith('https:')) && authToken) {
    try {
      const adapter = new PrismaLibSql({ url, authToken });
      return new PrismaClient({ adapter, log: ['error'] });
    } catch (e) {
      console.error('Erro ao instanciar PrismaLibSql adapter:', e);
    }
  }

  return new PrismaClient({ log: ['error'] });
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
