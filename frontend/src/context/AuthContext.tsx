import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set hardcoded admin user from env
    const adminToken = import.meta.env.VITE_ADMIN_TOKEN || 'admin-token';
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com';
    const adminName = import.meta.env.VITE_ADMIN_NAME || 'Admin User';
    const nameParts = adminName.split(' ');
    
    // Store token in localStorage for API requests
    localStorage.setItem('accessToken', adminToken);
    
    // Set user
    setUser({
      id: 'admin',
      email: adminEmail,
      firstName: nameParts[0] || 'Admin',
      lastName: nameParts.slice(1).join(' ') || 'User',
      role: 'ADMIN',
      status: 'ACTIVE'
    });
    
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
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

