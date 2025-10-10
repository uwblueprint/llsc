import baseAPIClient from '@/APIClients/baseAPIClient';
import { useEffect, useState, ReactNode } from 'react';

interface DirectoryDataProviderProps {
    children: (users: any[], loading: boolean, error: Error | null) => ReactNode;
}

export function DirectoryDataProvider({ children }: DirectoryDataProviderProps) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await baseAPIClient.get('/users');
                setUsers(response.data.users || response.data);
            } catch (err) {
                setError(err as Error);
                console.error('Failed to fetch users:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    return <>{children(users, loading, error)}</>;
}
