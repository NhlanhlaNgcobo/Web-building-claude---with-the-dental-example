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

function client(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

/**
 * The client is created on first use rather than when this module is imported.
 *
 * That is not an optimisation. `next build` imports every route to collect its
 * configuration, so a client constructed at import time turns a missing or
 * briefly unreachable DATABASE_URL into a failed build rather than a failed
 * request. It also means a platform whose database credentials are scoped to
 * runtime still builds, which is a perfectly reasonable way to configure one.
 *
 * The error still names the variable and says where to set it. It simply
 * arrives when something actually tries to query.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const value = Reflect.get(client(), property, receiver) as unknown;
    // Methods have to keep their `this`, or `prisma.$transaction(...)` loses
    // the instance it belongs to.
    return typeof value === 'function' ? value.bind(client()) : value;
  },
  has(_target, property) {
    return property in client();
  },
});

/**
 * The transaction client type, used by service functions that must run inside
 * an existing interactive transaction rather than opening their own.
 */
export type PrismaTransaction = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];
