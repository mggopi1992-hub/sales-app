import { createContext, ReactNode, useContext, useState } from 'react';
import { api } from '../api';
import { User } from '../types';

interface AuthState {
  user: User | null;
  login(email: string, password: string): Promise<void>;       // step 1 -> OTP email
  register(name: string, email: string, password: string): Promise<void>;
  verifyOtp(email: string, otp: string): Promise<User>;        // step 2 -> token
  logout(): void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => JSON.parse(localStorage.getItem('user') || 'null'));

  const value: AuthState = {
    user,
    login: async (email, password) => { await api('/auth/login', { body: { email, password } }); },
    register: async (name, email, password) => { await api('/auth/register', { body: { name, email, password } }); },
    verifyOtp: async (email, otp) => {
      const r = await api<{ token: string; user: User }>('/auth/verify-otp', { body: { email, otp } });
      localStorage.setItem('token', r.token);
      localStorage.setItem('user', JSON.stringify(r.user));
      setUser(r.user);
      return r.user;
    },
    logout: () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
