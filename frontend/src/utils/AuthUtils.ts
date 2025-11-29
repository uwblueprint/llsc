import AUTHENTICATED_USER_KEY from '../constants/AuthConstants';
import { getLocalStorageObjProperty } from './LocalStorageUtils';

/**
 * Get the current authenticated user's ID from localStorage
 * @returns The user ID or null if not found/authenticated
 */
export const getCurrentUserId = (): string | null => {
  const user = getLocalStorageObjProperty(AUTHENTICATED_USER_KEY, 'user') as { id: string } | null;
  return user?.id || null;
};

/**
 * Get the current authenticated user's access token from localStorage
 * @returns The access token or null if not found/authenticated
 */
export const getCurrentAccessToken = (): string | null => {
  return getLocalStorageObjProperty(AUTHENTICATED_USER_KEY, 'accessToken') as string;
};

/**
 * Get the current authenticated user's refresh token from localStorage
 * @returns The refresh token or null if not found/authenticated
 */
export const getCurrentRefreshToken = (): string | null => {
  return getLocalStorageObjProperty(AUTHENTICATED_USER_KEY, 'refreshToken') as string;
};

/**
 * Check if user is currently authenticated
 * @returns True if user has a valid session (has access token), false otherwise
 */
export const isAuthenticated = (): boolean => {
  const accessToken = getCurrentAccessToken();
  return !!accessToken;
};

/**
 * Get authorization headers for API requests
 * @returns Object with Authorization header or empty object if not authenticated
 */
export const getAuthHeaders = () => {
  const accessToken = getCurrentAccessToken();
  if (!accessToken) return {};

  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
};
