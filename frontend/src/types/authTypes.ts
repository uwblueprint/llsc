export type DecodedJWT =
  | string
  | null
  | { [key: string]: unknown; exp: number };
  
  export enum SignUpMethod {
    PASSWORD = "PASSWORD",
    GOOGLE = "GOOGLE"
}

export enum UserRole {
    PARTICIPANT = "participant",
    VOLUNTEER = "volunteer",
    ADMIN = "admin"
}

export interface UserBase {
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
}

export interface UserCreateRequest extends UserBase {
    password?: string;
    authId?: string;
    signupMethod: SignUpMethod;
}

export interface UserCreateResponse {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    roleId: number;
    authId: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface Token {
    accessToken: string;
    refreshToken: string;
}

export interface RefreshRequest {
    refreshToken: string;
}

export interface AuthResponse extends Token {
    user: UserCreateResponse;
}

// Type for an authenticated user in the system
export type AuthenticatedUser = UserCreateResponse & Token | null;