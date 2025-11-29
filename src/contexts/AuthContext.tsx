
// src/contexts/AuthContext.tsx
"use client";

import type ReactType from 'react';
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { getCurrentUser, logoutUser } from '@/actions/authActions';
// Export logoutUser for use in other components
export { logoutUser };
import type { SessionUser } from '@/lib/types';

interface AuthContextType {
  user: SessionUser | null;
  loading: boolean; // Represents loading for explicit refreshes, not initial load if initialUser is provided
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define props for AuthProvider
interface AuthProviderProps {
  children: ReactNode;
  initialUser: SessionUser | null; // Prop to pass initial user state
}

export const AuthProvider = ({ children, initialUser }: AuthProviderProps) => {
  // Initialize user state with the server-provided initialUser
  const [user, setUser] = useState<SessionUser | null>(initialUser);

  // 2. The only "loading" state is for manual refreshes, not initial load.
  const [loading, setLoading] = useState(false);

  // FIX: Prevent infinite updates by checking if data actually changed
  useEffect(() => {
    if (JSON.stringify(user) !== JSON.stringify(initialUser)) {
       setUser(initialUser);
    }
  }, [initialUser, user]);

  // The refreshUser function remains to allow explicit session re-fetching.
  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const currentUserData = await getCurrentUser();
      setUser(currentUserData);
    } catch (error) {
      console.error("Failed to refresh user session", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = { user, loading, refreshUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
