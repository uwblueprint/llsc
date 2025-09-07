import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { UserRole } from '@/types/authTypes';
import baseAPIClient from '@/APIClients/baseAPIClient';

interface AxiosError {
  response?: {
    status: number;
    data: unknown;
  };
  request?: unknown;
  message?: string;
}

interface AuthGuardState {
  loading: boolean;
  authorized: boolean;
}

// Map role IDs to UserRole enum
const roleIdToUserRole = (roleId: number): UserRole | null => {
  switch (roleId) {
    case 1:
      return UserRole.PARTICIPANT;
    case 2:
      return UserRole.VOLUNTEER;
    case 3:
      return UserRole.ADMIN;
    default:
      return null;
  }
};

/**
 * Hook to protect pages with authentication and role-based access control
 * @param allowedRoles - Array of roles that can access this page
 * @returns Object with loading and authorized states
 */
export const useAuthGuard = (allowedRoles: UserRole[]): AuthGuardState => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthGuardState>({
    loading: true,
    authorized: false,
  });

  // Memoize allowedRoles to prevent infinite re-renders
  const memoizedAllowedRoles = useMemo(() => allowedRoles, [allowedRoles]);

  const getUserRole = async (user: User): Promise<UserRole | null> => {
    const cacheKey = `userRole_${user.uid}`;

    // Check cache first
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { role, timestamp } = JSON.parse(cached);
        // Cache valid for 1 hour
        if (Date.now() - timestamp < 3600000) {
          return role;
        }
        // Remove expired cache
        sessionStorage.removeItem(cacheKey);
      }
    } catch {
      // If cache is corrupted, remove it and continue
      sessionStorage.removeItem(cacheKey);
    }

    try {
      // Get the Firebase ID token
      const token = await user.getIdToken();
      // Call your backend to get user data with role
      const response = await baseAPIClient.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Convert roleId to UserRole enum (API client converts snake_case to camelCase)
      const userRole = roleIdToUserRole(response.data.roleId);

      // Cache the result
      if (userRole) {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            role: userRole,
            timestamp: Date.now(),
          }),
        );
      }

      return userRole;
    } catch (error: unknown) {
      console.error('[useAuthGuard] Error fetching user role:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as AxiosError;
        console.error('[useAuthGuard] API Error status:', axiosError.response?.status);
        console.error('[useAuthGuard] API Error data:', axiosError.response?.data);
      } else if (error && typeof error === 'object' && 'request' in error) {
        console.error('[useAuthGuard] No response received:', (error as AxiosError).request);
      } else if (error && typeof error === 'object' && 'message' in error) {
        console.error('[useAuthGuard] Request setup error:', (error as AxiosError).message);
      }
      console.error('[useAuthGuard] Full error object:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          // No authenticated user - redirect to login
          router.push('/');
          return;
        }

        // Check if email is verified
        if (!user.emailVerified) {
          router.push(`/verify?email=${encodeURIComponent(user.email || '')}`);
          return;
        }

        // Get user role from backend
        const userRole = await getUserRole(user);

        if (!userRole) {
          // Could not get user role - redirect to login
          router.push('/');
          return;
        }

        if (!memoizedAllowedRoles.includes(userRole)) {
          // User doesn't have required role - redirect to unauthorized
          router.push('/unauthorized');
          return;
        }

        // User is authorized
        setAuthState({ loading: false, authorized: true });
      } catch (error) {
        console.error('Auth guard error:', error);
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router, memoizedAllowedRoles]);

  return authState;
};

/**
 * Clear all cached user role data from session storage
 * Call this function when the user logs out
 */
export const clearAuthCache = (): void => {
  try {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('userRole_')) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    // Session storage might not be available (e.g., in SSR or private browsing)
    console.warn('[useAuthGuard] Could not clear auth cache:', error);
  }
};
