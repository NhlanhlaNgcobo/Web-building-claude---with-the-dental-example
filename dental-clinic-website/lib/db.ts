import 'server-only';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { isServerless, requireDatabaseUrl } from '@/lib/env';

/**
 * Prisma client singleton.
 *
 * Prisma 7 connects through a driver adapter rather than a bundled engine
 * binary, which keeps the serverless bundle small and means the database can
 * be swapped by changing this one import.
 *
 * The global cache matters in two separate situations: it stops the Next.js
 * dev server opening a new pool on every hot reload, and on a serverless
 * platform it lets a warm function reuse the pool from a previous invocation
 * rather than connecting again.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const connectionString = requireDatabaseUrl();

  const adapter = new PrismaPg({
    connectionString,
    // Serverless functions are short lived and numerous, so a small pool per
    // instance is correct. A large pool here exhausts the database connection
    // limit as soon as traffic spreads across several instances. If the host
    // provides a pooled connection string, use that as DATABASE_URL.
    max: isServerless() ? 1 : 10,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * The transaction client type, used by service functions that must run inside
 * an existing interactive transaction rather than opening their own.
 */
export type PrismaTransaction = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];
