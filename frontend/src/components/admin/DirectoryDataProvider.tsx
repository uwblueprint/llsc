import baseAPIClient from '@/APIClients/baseAPIClient';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { UserResponse } from '@/APIClients/authAPIClient';

interface DirectoryDataProviderProps {
  children: (users: UserResponse[], loading: boolean, error: Error | null) => ReactNode;
}

export function DirectoryDataProvider({ children }: DirectoryDataProviderProps) {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await baseAPIClient.get('/users');
        const usersData = response.data?.users || response.data || [];
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error(
                typeof err === 'object' && err !== null && 'message' in err
                  ? String(err.message)
                  : 'Failed to fetch users. Please try again.',
              );
        setError(error);
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return <>{children(users, loading, error)}</>;
}
