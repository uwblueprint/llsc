import axios from 'axios';

import { 
    AuthenticatedUser, 
    UserCreateRequest, 
    UserCreateResponse,
    LoginRequest, 
    AuthResponse,
    RefreshRequest,
    Token,
} from '../types/authTypes';

// To Do: Add proper URL below
const API_URL = process.env.BACKEND_URL_name || "";

export const registerUser = async (userData: UserCreateRequest): Promise<UserCreateResponse> => {
    try {
        const response = await axios.post<UserCreateResponse>(`${API_URL}/auth/register`, userData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const loginUser = async (credentials: LoginRequest): Promise<AuthenticatedUser> => {
    try {
        const response = await axios.post<AuthResponse>(`${API_URL}/auth/login`, credentials);
        return { ...response.data.user, ...response.data };
    } catch (error) {
        throw error;
    }
};

export const logoutUser = async (token: string): Promise<void> => {
    try {
        await axios.post(`${API_URL}/auth/logout`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (error) {
        throw error;
    }
};

export const refreshUser = async (refreshToken: string): Promise<Token> => {
    try {
        const refreshRequest: RefreshRequest = { refreshToken };
        const response = await axios.post<Token>(`${API_URL}/auth/refresh`, refreshRequest);
        return response.data;
    } catch (error) {
        throw error;
    }
}; 