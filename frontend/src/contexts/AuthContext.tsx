import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { AuthenticatedUser } from '@/types/authTypes';
import AUTHENTICATED_USER_KEY from '@/constants/AuthConstants';
import baseAPIClient from '@/APIClients/baseAPIClient';

interface AuthContextType {
  // Auth state
  firebaseUser: FirebaseUser | null;
  user: AuthenticatedUser | null;
  loading: boolean;

  // Auth methods
  signOut: () => Promise<void>;
  syncUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user data with backend
  const syncUser = async (fbUser: FirebaseUser) => {
    try {
      const token = await fbUser.getIdToken();

      // Call backend to get full user data
      const { data } = await baseAPIClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData: AuthenticatedUser = {
        ...data,
        user: data,
        accessToken: token,
      };

      // Store in localStorage for compatibility with existing code
      if (globalThis.window !== undefined) {
        localStorage.setItem(AUTHENTICATED_USER_KEY, JSON.stringify(userData));
      }

      setUser(userData);
    } catch (error) {
      console.error('Error syncing user with backend:', error);

      // Fallback to Firebase user data if backend sync fails
      const token = await fbUser.getIdToken();
      const fallbackUser = {
        email: fbUser.email || '',
        uid: fbUser.uid,
        accessToken: token,
      } as unknown as AuthenticatedUser;

      if (globalThis.window !== undefined) {
        localStorage.setItem(AUTHENTICATED_USER_KEY, JSON.stringify(fallbackUser));
      }

      setUser(fallbackUser);
    }
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    console.log('🔥 Setting up Firebase auth listener');

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log('🔥 Auth state changed:', fbUser?.email || 'No user');

      setFirebaseUser(fbUser);

      if (fbUser) {
        // User is signed in - sync with backend
        await syncUser(fbUser);
      } else {
        // User is signed out - clear state
        setUser(null);
        if (globalThis.window !== undefined) {
          localStorage.removeItem(AUTHENTICATED_USER_KEY);
        }
      }

      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔥 Cleaning up Firebase auth listener');
      unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will handle cleanup
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value: AuthContextType = {
    firebaseUser,
    user,
    loading,
    signOut,
    syncUser: () => firebaseUser ? syncUser(firebaseUser) : Promise.resolve(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
