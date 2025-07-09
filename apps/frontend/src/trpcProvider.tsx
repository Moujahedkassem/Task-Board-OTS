import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, loggerLink, createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../backend/src/routers/_app';

export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient();

export const TrpcProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <trpc.Provider
      client={trpc.createClient({
        links: [
          loggerLink(),
          httpBatchLink({
            url: 'http://localhost:4000/trpc',
            headers: () => {
              const token = localStorage.getItem('auth_token');
              return token ? { Authorization: `Bearer ${token}` } : {};
            },
          }),
        ],
      })}
      queryClient={queryClient}
    >
      {children}
    </trpc.Provider>
  );
}; 