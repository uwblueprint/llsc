import { 
    AuthenticatedUser, 
    UserCreateResponse,
    LoginRequest, 
    AuthResponse,
    RefreshRequest,
    Token,
    UserRole,
    SignUpMethod
} from '../types/AuthTypes';

import AUTHENTICATED_USER_KEY from '../constants/AuthConstants';
import baseAPIClient from './BaseAPIClient';
import { getLocalStorageObjProperty, setLocalStorageObjProperty } from '../utils/LocalStorageUtils';


const login = async (
    email: string,
    password: string,
): Promise<AuthenticatedUser> => {
    try {
        const loginRequest: LoginRequest = { email, password };
        const { data } = await baseAPIClient.post<AuthResponse>(
            "/auth/login",
            loginRequest,
            { withCredentials: true },
        );
        localStorage.setItem(AUTHENTICATED_USER_KEY, JSON.stringify(data));
        return { ...data.user, ...data };
    } catch (error) {
        return null;
    }
};

const loginWithGoogle = async (idToken: string): Promise<AuthenticatedUser> => {
    try {
        const { data } = await baseAPIClient.post<AuthResponse>(
            "/auth/login",
            { idToken },
            { withCredentials: true },
        );
        localStorage.setItem(AUTHENTICATED_USER_KEY, JSON.stringify(data));
        return { ...data.user, ...data };
    } catch (error) {
        return null;
    }
};

const logout = async (): Promise<boolean> => {
    const bearerToken = `Bearer ${getLocalStorageObjProperty(
        AUTHENTICATED_USER_KEY,
        "accessToken",
    )}`;
    try {
        await baseAPIClient.post(
            "/auth/logout",
            {},
            { headers: { Authorization: bearerToken } },
        );
        localStorage.removeItem(AUTHENTICATED_USER_KEY);
        return true;
    } catch (error) {
        return false;
    }
};

const register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    role: UserRole = UserRole.PARTICIPANT,
): Promise<AuthenticatedUser> => {
    try {
        const registerRequest: UserCreateRequest = {
            firstName,
            lastName,
            email,
            password,
            role,
            signupMethod: SignUpMethod.PASSWORD
        };
        
        const { data } = await baseAPIClient.post<UserCreateResponse>(
            "/auth/register",
            registerRequest,
            { withCredentials: true },
        );
        
        // After registration, we need to login to get the tokens
        return await login(email, password);
    } catch (error) {
        return null;
    }
};

const resetPassword = async (email: string | undefined): Promise<boolean> => {
    const bearerToken = `Bearer ${getLocalStorageObjProperty(
      AUTHENTICATED_USER_KEY,
      "accessToken",
    )}`;
    try {
      await baseAPIClient.post(
        `/auth/resetPassword/${email}`,
        {},
        { headers: { Authorization: bearerToken } },
      );
      return true;
    } catch (error) {
      return false;
    }
};

const refresh = async (): Promise<boolean> => {
    try {
        const refreshToken = getLocalStorageObjProperty(
            AUTHENTICATED_USER_KEY,
            "refreshToken",
        );
        
        const refreshRequest: RefreshRequest = { refreshToken: refreshToken as string };
        const { data } = await baseAPIClient.post<Token>(
            "/auth/refresh",
            refreshRequest,
            { withCredentials: true },
        );
        
        setLocalStorageObjProperty(
            AUTHENTICATED_USER_KEY,
            "accessToken",
            data.accessToken,
        );
        setLocalStorageObjProperty(
            AUTHENTICATED_USER_KEY,
            "refreshToken",
            data.refreshToken,
        );
        return true;
    } catch (error) {
        return false;
    }
};

export default { login, logout, loginWithGoogle, register, resetPassword, refresh };