import { router } from '../trpc';
import { authRouter } from './auth';
import { taskRouter } from './task';
import { userRouter } from './user';

export const appRouter = router({
  auth: authRouter,
  task: taskRouter,
  user: userRouter,
  // Add other routers here (task, user, etc.)
});

export type AppRouter = typeof appRouter; 