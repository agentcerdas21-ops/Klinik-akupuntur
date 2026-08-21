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
    // Check if explicitly logged out
    const isLoggedOut = localStorage.getItem('acucare_is_logged_out');
    if (isLoggedOut === 'true') {
      return null;
    }

    const saved = localStorage.getItem('acucare_active_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) return parsed;
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
      localStorage.removeItem('acucare_is_logged_out');
    } else {
      localStorage.removeItem('acucare_active_user');
      localStorage.setItem('acucare_is_logged_out', 'true');
    }
  }, [user]);

  const login = (email: string, selectedRole: UserRole = 'OWNER'): boolean => {
    const users = db.getUsers();
    let found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      const defaultName = selectedRole === 'OWNER' ? 'Yogi Pangestu' : 'Siti Rahma (Admin)';
      found = {
        id: 'usr_' + Date.now(),
        name: email.toLowerCase().includes('owner') ? 'Yogi Pangestu' : email.toLowerCase().includes('admin') ? 'Siti Rahma' : defaultName,
        email,
        role: selectedRole,
        created_at: new Date().toISOString()
      };
      db.saveUser(found);
    } else {
      // Ensure role is up-to-date with selectedRole
      found = {
        ...found,
        role: selectedRole
      };
    }
    localStorage.removeItem('acucare_is_logged_out');
    setUser(found);
    return true;
  };

  const logout = () => {
    localStorage.setItem('acucare_is_logged_out', 'true');
    localStorage.removeItem('acucare_active_user');
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
