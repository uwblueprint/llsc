import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { Box, Text } from '@chakra-ui/react';

/**
 * Higher-Order Component (HOC) that wraps a component with authentication protection.
 * Redirects to login if user is not authenticated.
 * Shows loading state while authentication is being verified.
 *
 * @param Component - The component to wrap with auth protection
 * @param redirectTo - The path to redirect to if not authenticated (default: '/login')
 * @returns Protected component
 *
 * @example
 * const ProtectedPage: React.FC = () => {
 *   const { user } = useAuth(); // user is guaranteed to exist here
 *   return <div>Protected content for {user.email}</div>;
 * };
 *
 * export default withAuth(ProtectedPage);
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = '/login'
) => {
  const ProtectedComponent: React.FC<P> = (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // Redirect to login if not authenticated after loading completes
      if (!loading && !user) {
        router.push(redirectTo);
      }
    }, [loading, user, router]);

    // Show loading state while authentication is being verified
    if (loading) {
      return (
        <Box
          minH="100vh"
          bg="white"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Text fontSize="lg" color="#495D6C">Loading...</Text>
        </Box>
      );
    }

    // Don't render anything if not authenticated (will redirect)
    if (!user) {
      return null;
    }

    // User is authenticated, render the protected component
    return <Component {...props} />;
  };

  // Set display name for better debugging
  ProtectedComponent.displayName = `withAuth(${Component.displayName || Component.name || 'Component'})`;

  return ProtectedComponent;
};
