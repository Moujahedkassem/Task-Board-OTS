import React, { createContext, useContext } from "react";
import { trpc } from "../trpc";

export interface User {
  id: string;
  name: string;
  email: string;
}

interface UserContextType {
  users: User[];
  loading: boolean;
  error: unknown;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: users = [], isLoading, error } = trpc.user.getAll.useQuery();

  return (
    <UserContext.Provider value={{ users, loading: isLoading, error }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUsers must be used within a UserProvider");
  return ctx;
}; 