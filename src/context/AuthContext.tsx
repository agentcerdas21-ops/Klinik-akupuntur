import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/storage';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isOwner: boolean;
  login: (email: string, role?: UserRole) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('acucare_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    // Default logged in as Owner (Yogi Pangestu)
    return {
      id: 'usr_owner_01',
      name: 'Yogi Pangestu',
      email: 'owner@acucare.id',
      role: 'OWNER',
      created_at: '2026-01-01T08:00:00.000Z'
    };
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('acucare_active_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('acucare_active_user');
    }
  }, [user]);

  const login = (email: string, selectedRole: UserRole = 'OWNER'): boolean => {
    const users = db.getUsers();
    let found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      found = {
        id: 'usr_' + Date.now(),
        name: selectedRole === 'OWNER' ? 'Yogi Pangestu' : 'Admin Staff',
        email,
        role: selectedRole,
        created_at: new Date().toISOString()
      };
      db.saveUser(found);
    }
    setUser(found);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const updated: User = {
      ...user,
      name: newRole === 'OWNER' ? 'Yogi Pangestu' : 'Siti Rahma (Admin)',
      role: newRole
    };
    setUser(updated);
  };

  const role: UserRole = user?.role || 'OWNER';
  const isOwner = role === 'OWNER';

  return (
    <AuthContext.Provider value={{ user, role, isOwner, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
