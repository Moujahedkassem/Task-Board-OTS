import { initTRPC } from '@trpc/server';
import type { inferAsyncReturnType } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

export const createContext = async (opts: CreateExpressContextOptions) => {
  return {
    req: opts.req,
    res: opts.res,
    user: (opts.req as any).user || null,
  };
};
export type Context = inferAsyncReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
export const protectedProcedure = t.procedure.use(async (opts) => opts.next()); 