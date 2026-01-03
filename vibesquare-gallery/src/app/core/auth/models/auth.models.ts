export interface SafeGalleryUser {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
    bio?: string;
    socialLinks: {
        twitter?: string;
        linkedin?: string;
        portfolio?: string;
        github?: string;
    };
    isActive: boolean;
    emailVerified: boolean;
    subscriptionTier: 'free' | 'pro';
    lastDownloadAt?: Date;
    canDownload: boolean;
    hasPanelAccess: boolean;
    createdAt: Date;
    lastLoginAt?: Date;
    googleId?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user: SafeGalleryUser |any;
        accessToken: string;
        isNewUser?: boolean;
    } | null;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
}

export interface VerifyEmailPayload {
    token: string;
}

export interface RefreshTokenResponse {
    success: boolean;
    message: string;
    data: {
        accessToken: string;
    };
}

export type OAuthProvider = 'google' | 'github';

export interface OAuthConflictData {
    status: 409;
    message: string;
    email?: string;
}

export interface OAuthErrorData {
    error: string;
    error_description?: string;
}
