import React from 'react';
import { UserRole } from '@/types/authTypes';
import { AuthLoadingSkeleton } from '@/components/auth/AuthLoadingSkeleton';
import { useAuthGuard } from './useAuthGuard';

interface UseProtectedRouteResult {
  loading: boolean;
  authorized: boolean;
  LoadingComponent: React.ComponentType | null;
}

/**
 * Hook that combines auth guarding with loading skeleton
 * Returns a LoadingComponent that you can render while auth is being checked
 *
 * @param allowedRoles - Array of roles that can access this page
 * @returns Object with loading state, authorized state, and LoadingComponent
 */
export const useProtectedRoute = (allowedRoles: UserRole[]): UseProtectedRouteResult => {
  const { loading, authorized } = useAuthGuard(allowedRoles);

  const LoadingComponent = loading ? () => React.createElement(AuthLoadingSkeleton) : null;

  return {
    loading,
    authorized,
    LoadingComponent,
  };
};
