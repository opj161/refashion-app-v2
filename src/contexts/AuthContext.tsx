// src/contexts/AuthContext.tsx
"use client";

import type ReactType from 'react';
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { getCurrentUser, logoutUser } from '@/actions/authActions';
import type { SessionUser } from '@/lib/types';

interface AuthContextType {
  user: SessionUser | null;
  loading: boolean;
  isHydrated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define props for AuthProvider
interface AuthProviderProps {
  children: ReactNode;
  initialUser: SessionUser | null; // Prop to pass initial user state
}

export const AuthProvider = ({ children, initialUser }: AuthProviderProps) => {
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [loading, setLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

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

  const value = { user, loading, isHydrated, refreshUser };

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

// UserAuthStatus component remains largely the same but benefits from faster initial user state
export const UserAuthStatus = () => {
  const { user, loading: authContextLoading, isHydrated } = useAuth();

  // Show loading if AuthContext is loading (e.g. during a refresh) OR if not yet hydrated
  if (authContextLoading || !isHydrated) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (user?.isLoggedIn) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium">{user.username}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        </div>
        <form action={logoutUser}>
          <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            Logout
          </Button>
        </form>
      </div>
    );
  }
  
  // If not logged in, show login button
  return (
    <Button asChild variant="default" size="sm">
      <a href="/login">Login</a>
    </Button>
  );
};
