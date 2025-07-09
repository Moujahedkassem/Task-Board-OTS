import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { PrismaClient, TaskStatus } from '@prisma/client';
import { io } from '../index';

const prisma = new PrismaClient();

export const taskRouter = router({
  getAll: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      assigneeId: z.string().optional(),
      from: z.string().optional(),
      to: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const where: any = {};
      if (input?.search) {
        where.OR = [
          { title: { contains: input.search, mode: 'insensitive' } },
          { description: { contains: input.search, mode: 'insensitive' } },
        ];
      }
      if (input?.assigneeId) where.assigneeId = input.assigneeId;
      if (input?.from) where.createdAt = { ...where.createdAt, gte: new Date(input.from) };
      if (input?.to) where.createdAt = { ...where.createdAt, lte: new Date(input.to + 'T23:59:59') };
      return prisma.task.findMany({ where, orderBy: { createdAt: 'desc' } });
    }),
  getById: publicProcedure.input(z.string()).query(async ({ input }) => {
    return prisma.task.findUnique({ where: { id: input } });
  }),
  create: publicProcedure.input(z.object({
    title: z.string(),
    description: z.string(),
    status: z.nativeEnum(TaskStatus),
    assigneeId: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const task = await prisma.task.create({ data: { ...input, assigneeId: input.assigneeId ?? null } });
    io.emit('task:created', { task, user: ctx.user, action: 'created' });
    return task;
  }),
  update: publicProcedure.input(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    status: z.nativeEnum(TaskStatus),
    assigneeId: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    const task = await prisma.task.update({ where: { id }, data: { ...data, assigneeId: data.assigneeId ?? null } });
    io.emit('task:updated', { task, user: ctx.user, action: 'updated' });
    return task;
  }),
  delete: publicProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
    const task = await prisma.task.delete({ where: { id: input } });
    io.emit('task:deleted', { task, user: ctx.user, action: 'deleted' });
    return task;
  }),
}); 