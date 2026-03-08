import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'AGENT' | 'CLIENT';
  phone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }): React.ReactElement => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ✅ v2 : vérifier access_token au lieu de token
    const stored = localStorage.getItem('user');
    const token  = localStorage.getItem('access_token');

    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    } else {
      // Pas de token → nettoyer
      localStorage.removeItem('user');
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      const response = await apiService.login(email, password);

      if (response.error) {
        return { error: response.error };
      }

      if (response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      return {};
    } catch (e) {
      return { error: 'Erreur de connexion, vérifiez votre réseau' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      const response = await apiService.register(name, email, password, 'CLIENT');

      if (response.error) {
        return { error: response.error };
      }

      // Auto-login après inscription
      return await login(email, password);
    } catch (e) {
      return { error: 'Erreur lors de l\'inscription' };
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ v2 : logout est async pour appeler le backend
  const logout = async (): Promise<void> => {
    setUser(null);
    await apiService.logout();
    localStorage.removeItem('user');
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};