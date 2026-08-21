import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url && (url.startsWith('libsql:') || url.startsWith('https:')) && authToken) {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = url;
    }
    const libsql = createClient({
      url,
      authToken,
    });
    const adapter = new PrismaLibSql(libsql as any);
    return new PrismaClient({ adapter, log: ['error'] });
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./dev.db';
  }

  return new PrismaClient({ log: ['error'] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
