import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
// Fix this import
import { jwtDecode } from 'jwt-decode';
import { camelizeKeys, decamelizeKeys } from 'humps';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/config/firebase';

import AUTHENTICATED_USER_KEY from '../constants/AuthConstants';
import { setLocalStorageObjProperty } from '../utils/LocalStorageUtils';

import { DecodedJWT } from '../types/authTypes';

/**
 * Wait for Firebase auth to initialize and return the current user
 * This handles the race condition where API calls happen before auth is ready
 * @returns Promise that resolves to the current user (or null if not authenticated)
 */
const waitForAuthInit = (): Promise<User | null> => {
  return new Promise((resolve) => {
    // If auth is already initialized and we have a user, return immediately
    if (auth.currentUser !== null) {
      resolve(auth.currentUser);
      return;
    }

    // If auth is already initialized but no user, return null immediately
    // Check if auth has been initialized by checking if onAuthStateChanged fires synchronously
    let resolved = false;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!resolved) {
        resolved = true;
        unsubscribe();
        resolve(user);
      }
    });

    // Safety timeout - if auth doesn't initialize within 5 seconds, resolve with null
    // This prevents hanging requests if there's an auth initialization issue
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        unsubscribe();
        resolve(null);
      }
    }, 5000);
  });
};

const baseAPIClient = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080',
});

// Python API uses snake_case, frontend uses camelCase
// convert request and response data to/from snake_case and camelCase through axios interceptors
// python {
baseAPIClient.interceptors.response.use((response: AxiosResponse) => {
  if (response.data && response.headers['content-type'] === 'application/json') {
    response.data = camelizeKeys(response.data);
  }
  return response;
});
// } python

baseAPIClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const newConfig = { ...config };

  // Inject Firebase ID token if not already present
  try {
    if (!newConfig.headers.Authorization) {
      // Wait for auth to initialize (handles race condition on page load)
      const user = await waitForAuthInit();
      if (user) {
        const idToken = await user.getIdToken();
        newConfig.headers.Authorization = `Bearer ${idToken}`;
      }
    }
  } catch (error) {
    // Log error but don't block the request - let backend handle auth errors
    console.error('[baseAPIClient] Error getting auth token:', error);
  }

  // if access token in header has expired, do a refresh
  const authHeaderParts = config.headers.Authorization?.toString().split(' ');
  if (
    authHeaderParts &&
    authHeaderParts.length >= 2 &&
    authHeaderParts[0].toLowerCase() === 'bearer'
  ) {
    const decodedToken = jwtDecode(authHeaderParts[1]) as DecodedJWT;

    if (
      decodedToken &&
      (typeof decodedToken === 'string' ||
        decodedToken.exp <= Math.round(new Date().getTime() / 1000))
    ) {
      const { data } = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const accessToken = data.accessToken || data.access_token;
      setLocalStorageObjProperty(AUTHENTICATED_USER_KEY, 'accessToken', accessToken);

      newConfig.headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  // python {
  if (config.params) {
    newConfig.params = decamelizeKeys(config.params);
  }
  if (config.data && !(config.data instanceof FormData)) {
    newConfig.data = decamelizeKeys(config.data);
  }
  // } python

  return newConfig;
});

export default baseAPIClient;
