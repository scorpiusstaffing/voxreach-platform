import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setToken, clearToken } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Organization {
  id: string;
  name: string;
  intent: 'inbound' | 'outbound';
  plan: string;
}

interface AuthState {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { email: string; password: string; name: string; organizationName: string; intent: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('voxreach_token');
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          setOrganization(res.data.organization);
        })
        .catch(() => clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    setOrganization(res.data.organization);
  };

  const signup = async (data: { email: string; password: string; name: string; organizationName: string; intent: string }) => {
    const res = await api.post('/auth/signup', data);
    setToken(res.data.token);
    setUser(res.data.user);
    setOrganization(res.data.organization);
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setOrganization(null);
  };

  return (
    <AuthContext.Provider value={{ user, organization, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
