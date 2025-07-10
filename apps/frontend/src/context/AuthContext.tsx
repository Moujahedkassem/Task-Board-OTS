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
  resetEmail: string | null;
  getToken: () => string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<boolean>;
  verifyResetCode: (code: string) => Promise<boolean>;
  resetPassword: (code: string, newPassword: string) => Promise<boolean>;
  clearResetState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState<string | null>(null);

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
  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation();
  const verifyResetCodeMutation = trpc.auth.verifyResetCode.useMutation();
  const resetPasswordMutation = trpc.auth.resetPassword.useMutation();

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

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    try {
      await requestResetMutation.mutateAsync({ email });
      // Store email in global state
      setResetEmail(email);
      return true;
    } catch (err: any) {
      console.error('Password reset request error:', err);
      throw new Error('Failed to send reset code');
    }
  };

  const verifyResetCode = async (code: string): Promise<boolean> => {
    try {
      const result = await verifyResetCodeMutation.mutateAsync({ code });
      if (result?.success) {
        return true;
      }
      throw new Error('Invalid reset code');
    } catch (err: any) {
      console.error('Password reset code verification error:', err);
      throw err;
    }
  };

  const resetPassword = async (code: string, newPassword: string): Promise<boolean> => {
    try {
      await resetPasswordMutation.mutateAsync({ code, newPassword });
      clearResetState();
      return true;
    } catch (err: any) {
      console.error('Password reset error:', err);
      throw err;
    }
  };

  const clearResetState = () => {
    setResetEmail(null);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearResetState();
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
  };

  const getToken = () => {
    return token || localStorage.getItem("auth_token");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      resetEmail,
      getToken, 
      login, 
      register, 
      logout,
      requestPasswordReset,
      verifyResetCode,
      resetPassword,
      clearResetState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}; 