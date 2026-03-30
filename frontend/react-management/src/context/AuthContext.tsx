import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '../api/axios';

interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'viewer' | string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<User>('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function login(email: string, password: string) {
    const form = new URLSearchParams();
    form.append('username', email);
    form.append('password', password);

    const { data } = await api.post<{ access_token: string; token_type: string }>(
      '/auth/login',
      form.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);

    const me = await api.get<User>('/auth/me', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    setUser(me.data);
  }

  async function register(email: string, password: string, name: string) {
    const { data } = await api.post<{ access_token: string; token_type: string }>(
      '/auth/register',
      { email, password, name }
    );

    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);

    const me = await api.get<User>('/auth/me', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    setUser(me.data);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, isAdmin: user?.role === 'admin' }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
