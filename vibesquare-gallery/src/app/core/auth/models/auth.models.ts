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
    subscriptionTier: 'free' | 'premium';
    lastDownloadAt?: Date;
    canDownload: boolean;
    hasPanelAccess: boolean;
    createdAt: Date;
    lastLoginAt?: Date;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user: SafeGalleryUser |any;
        accessToken: string;
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
