import express from 'express';
import http from 'http';
import cors from 'cors';
import { appRouter } from './routers/_app';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createContext } from './trpc';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// JWT middleware: decode token and attach user to req.user
app.use((req, res, next) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    try {
      const user = jwt.verify(token, JWT_SECRET);
      (req as any).user = user;
    } catch (err) {
      // Invalid token, ignore
      (req as any).user = null;
    }
  } else {
    (req as any).user = null;
  }
  next();
});

app.use('/trpc', createExpressMiddleware({ router: appRouter, createContext }));

const onlineUsers = new Map<string, number>();

function getUserIdFromSocket(socket: any): string | null {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return null;
    const user = jwt.verify(token, JWT_SECRET);
    if (typeof user === 'object' && user && 'id' in user && typeof user.id === 'string') {
      return user.id;
    }
    return null;
  } catch {
    return null;
  }
}

const server = http.createServer(app);
export const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  const userId = getUserIdFromSocket(socket);
  if (userId) {
    const prevCount = onlineUsers.get(userId) || 0;
    onlineUsers.set(userId, prevCount + 1);
    if (prevCount === 0) {
      io.emit('online-users', Array.from(onlineUsers.keys()));
    }
  }

  socket.on('disconnect', () => {
    if (userId) {
      const prevCount = onlineUsers.get(userId) || 0;
      if (prevCount <= 1) {
        onlineUsers.delete(userId);
        io.emit('online-users', Array.from(onlineUsers.keys()));
      } else {
        onlineUsers.set(userId, prevCount - 1);
      }
    }
  });

  console.log('Socket.IO client connected:', socket.id, userId ? `user: ${userId}` : 'unauthenticated');
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 