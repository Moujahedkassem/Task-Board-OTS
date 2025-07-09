import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const userRouter = router({
  getAll: publicProcedure.query(async () => {
    return prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
  }),
  getById: publicProcedure.input(z.string()).query(async ({ input }) => {
    return prisma.user.findUnique({
      where: { id: input },
      select: { id: true, name: true, email: true },
    });
  }),
  create: publicProcedure.input(z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
  })).mutation(async ({ input }) => {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: input.password, // In production, hash the password!
      },
      select: { id: true, name: true, email: true },
    });
    return user;
  }),
  update: publicProcedure.input(z.object({
    id: z.string(),
    name: z.string().min(1),
    email: z.string().email(),
  })).mutation(async ({ input }) => {
    const user = await prisma.user.update({
      where: { id: input.id },
      data: {
        name: input.name,
        email: input.email,
      },
      select: { id: true, name: true, email: true },
    });
    return user;
  }),
  delete: publicProcedure.input(z.string()).mutation(async ({ input }) => {
    await prisma.user.delete({ where: { id: input } });
    return { success: true };
  }),
}); 