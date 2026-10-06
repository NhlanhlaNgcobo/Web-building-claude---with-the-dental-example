import 'server-only';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { isServerless, requireDatabaseUrl } from '@/lib/env';

/**
 * Prisma client singleton.
 *
 * The global cache matters in two places: it stops the dev server opening a
 * new pool on every hot reload, and on a serverless platform it lets a warm
 * function reuse the pool from a previous invocation rather than reconnecting.
 *
 * The client is created on first use rather than when this module is imported.
 * That is not an optimisation, it is what lets `next build` succeed without a
 * database: the build imports every route to collect its configuration, and a
 * client constructed at import time would turn a missing DATABASE_URL into a
 * build failure rather than a runtime one. It also means a deployment whose
 * database credentials are scoped to runtime still builds, which is a common
 * and perfectly reasonable way to configure a platform.
 *
 * The error, when it does come, still names the variable and says where to set
 * it. It just arrives when something actually tries to query.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: requireDatabaseUrl(),
    // Serverless functions are short lived and numerous, so one connection
    // per instance is correct. A large pool here exhausts the database
    // connection limit as soon as traffic spreads across instances.
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
 * A stand-in that builds the real client the first time anything is read from
 * it. Callers use it exactly as they would a PrismaClient.
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

export type PrismaTransaction = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];
