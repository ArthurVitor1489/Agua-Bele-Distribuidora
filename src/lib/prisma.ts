import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Garantir que a variavel de ambiente DATABASE_URL sempre exista no processo Node.js
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TURSO_DATABASE_URL || 'file:./dev.db';
}

function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && (tursoUrl.startsWith('libsql:') || tursoUrl.startsWith('https:')) && authToken) {
    const libsql = createClient({
      url: tursoUrl,
      authToken: authToken,
    });
    const adapter = new PrismaLibSql(libsql as any);
    return new PrismaClient({ adapter, log: ['error'] });
  }

  return new PrismaClient({ log: ['error'] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
