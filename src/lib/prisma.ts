import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaClient(): PrismaClient {
  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || '';
  const authToken = process.env.TURSO_AUTH_TOKEN || '';

  if (url && (url.startsWith('libsql:') || url.startsWith('https:')) && authToken) {
    try {
      const libsql = createClient({
        url: url.trim(),
        authToken: authToken.trim(),
      });
      const adapter = new PrismaLibSql(libsql as any);
      return new PrismaClient({ adapter, log: ['error'] });
    } catch (e) {
      console.error('Erro ao conectar ao Turso Cloud, usando cliente padrao:', e);
    }
  }

  const fallbackUrl = url && url.startsWith('file:') ? url : 'file:./dev.db';

  return new PrismaClient({
    datasources: {
      db: {
        url: fallbackUrl,
      },
    },
    log: ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
