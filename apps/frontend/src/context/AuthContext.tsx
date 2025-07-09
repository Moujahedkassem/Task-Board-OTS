import React, { createContext, useContext, useState, useEffect } from "react";
import { trpc } from '../trpc';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  getToken: () => string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("auth_user");
    const storedToken = localStorage.getItem("auth_token");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("auth_user");
        setUser(null);
      }
    }
    if (storedToken) setToken(storedToken);
  }, []);

  const loginMutation = trpc.auth.login.useMutation();

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await loginMutation.mutateAsync({ email, password });
      if (result?.success && result.user && result.token) {
        setUser(result.user);
        setToken(result.token);
        localStorage.setItem("auth_user", JSON.stringify(result.user));
        localStorage.setItem("auth_token", result.token);
        return true;
      }
      throw new Error('Login failed: No user/token returned');
    } catch (err: any) {
      const msg = err?.message?.toLowerCase?.() || '';
      const dataMsg = err?.data?.message?.toLowerCase?.() || '';
      const shapeMsg = err?.shape?.message?.toLowerCase?.() || '';
      if (
        msg.includes('invalid credentials') ||
        dataMsg.includes('invalid credentials') ||
        shapeMsg.includes('invalid credentials')
      ) {
        throw new Error('Invalid email or password');
      }
      console.error('tRPC login error:', err);
      throw err;
    }
  };

  const registerMutation = trpc.auth.register.useMutation();

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const result = await registerMutation.mutateAsync({ name, email, password });
      if (result?.success && result.user && result.token) {
        setUser(result.user);
        setToken(result.token);
        localStorage.setItem("auth_user", JSON.stringify(result.user));
        localStorage.setItem("auth_token", result.token);
        return true;
      }
      throw new Error('Registration failed: No user/token returned');
    } catch (err: any) {
      // Try to detect duplicate email error from tRPC or backend
      const msg = err?.message?.toLowerCase?.() || '';
      const dataMsg = err?.data?.message?.toLowerCase?.() || '';
      const shapeMsg = err?.shape?.message?.toLowerCase?.() || '';
      if (
        msg.includes('email in use') ||
        msg.includes('email already') ||
        dataMsg.includes('email in use') ||
        dataMsg.includes('email already') ||
        shapeMsg.includes('email in use') ||
        shapeMsg.includes('email already')
      ) {
        throw new Error('Email already in use');
      }
      console.error('tRPC register error:', err);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
  };

  const getToken = () => {
    return token || localStorage.getItem("auth_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, getToken, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}; 