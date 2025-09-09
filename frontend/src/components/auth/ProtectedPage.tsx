import React from 'react';
import { UserRole } from '@/types/authTypes';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

interface ProtectedPageProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

/**
 * Wrapper component that handles auth protection logic for pages
 * Eliminates the need to repeat auth checks in every protected page
 */
export const ProtectedPage: React.FC<ProtectedPageProps> = ({ allowedRoles, children }) => {
  const { authorized, LoadingComponent } = useProtectedRoute(allowedRoles);

  // Show loading skeleton while checking auth
  if (LoadingComponent) {
    return <LoadingComponent />;
  }

  // This will never be reached due to redirects in the hook, but good for safety
  if (!authorized) {
    return null;
  }

  return <>{children}</>;
};
