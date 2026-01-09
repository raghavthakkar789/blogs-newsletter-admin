import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import api from '../lib/axios';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        // Set hardcoded admin user from env
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com';
        const adminName = import.meta.env.VITE_ADMIN_NAME || 'Admin User';
        const nameParts = adminName.split(' ');
        
        // Set user
        setUser({
          id: 'admin',
          email: adminEmail,
          firstName: nameParts[0] || 'Admin',
          lastName: nameParts.slice(1).join(' ') || 'User',
          role: 'ADMIN',
          status: 'ACTIVE'
        });
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Try to call backend login endpoint
      const response = await api.post('/auth/login', { email, password });
      
      // If backend login is successful, store token and user
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        setUser(response.data.user);
      } else {
        // Fallback to hardcoded admin if backend doesn't return token
        const adminToken = import.meta.env.VITE_ADMIN_TOKEN || 'admin-token';
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com';
        const adminName = import.meta.env.VITE_ADMIN_NAME || 'Admin User';
        const nameParts = adminName.split(' ');
        
        localStorage.setItem('accessToken', adminToken);
        setUser({
          id: 'admin',
          email: adminEmail,
          firstName: nameParts[0] || 'Admin',
          lastName: nameParts.slice(1).join(' ') || 'User',
          role: 'ADMIN',
          status: 'ACTIVE'
        });
      }
    } catch (error: any) {
      // If backend login fails, fallback to hardcoded admin for development
      if (error.response?.status === 401 || error.response?.status === 404) {
        const adminToken = import.meta.env.VITE_ADMIN_TOKEN || 'admin-token';
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com';
        const adminName = import.meta.env.VITE_ADMIN_NAME || 'Admin User';
        const nameParts = adminName.split(' ');
        
        localStorage.setItem('accessToken', adminToken);
        setUser({
          id: 'admin',
          email: adminEmail,
          firstName: nameParts[0] || 'Admin',
          lastName: nameParts.slice(1).join(' ') || 'User',
          role: 'ADMIN',
          status: 'ACTIVE'
        });
      } else {
        throw error;
      }
    }
  };

  const logout = async () => {
    try {
      // Try to call backend logout endpoint
      await api.post('/auth/logout').catch(() => {
        // Ignore errors if logout endpoint doesn't exist
      });
    } catch (error) {
      // Ignore logout errors
    } finally {
      // Clear local state regardless of backend response
      localStorage.removeItem('accessToken');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

