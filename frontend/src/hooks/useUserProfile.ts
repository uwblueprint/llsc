import { useState, useEffect } from 'react';
import { getUserById } from '@/APIClients/authAPIClient';
import { UserResponse } from '@/types/userTypes';

export function useUserProfile(userId: string | string[] | undefined) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      const fetchUser = async () => {
        try {
          const userData = await getUserById(userId as string);
          setUser(userData);
        } catch (error) {
          console.error('Failed to fetch user:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    }
  }, [userId]);

  return { user, loading, setUser };
}
