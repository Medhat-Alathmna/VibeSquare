import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, throwError } from 'rxjs';
import { API_CONFIG } from '../../constants/api.constants';
import { LoginPayload, RegisterPayload, AuthResponse, SafeGalleryUser, RefreshTokenResponse, VerifyEmailPayload, OAuthProvider } from '../models/auth.models';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = `${API_CONFIG.baseUrl}/auth`;
    private accessTokenKey = 'gallery_access_token';

    // Signal for current user state
    currentUser = signal<SafeGalleryUser | null>(null);
    isAuthenticated = signal<boolean>(false);

    constructor(private http: HttpClient) {
        this.loadToken();
    }

    private loadToken() {
        const token = localStorage.getItem(this.accessTokenKey);
        if (token) {
            this.isAuthenticated.set(true);
            // Ideally we would validate token or fetch user here
            this.getCurrentUser().subscribe();
        }
    }

    login(payload: LoginPayload): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload).pipe(
            tap(response => {
                if (response.success && response.data) {
                    this.setSession(response.data.accessToken, response.data.user);
                }
            })
        );
    }

    register(payload: RegisterPayload): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload);
    }

    verifyEmail(payload: VerifyEmailPayload): Observable<any> {
        return this.http.post(`${this.apiUrl}/verify-email`, payload);
    }

    logout(): Observable<any> {
        return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
            tap(() => this.clearSession()),
            catchError(() => {
                this.clearSession();
                return of(true);
            })
        );
    }

    refreshToken(): Observable<RefreshTokenResponse> {
        // Cookie is handled by browser/interceptor usually, but here we just call the endpoint
        // with credentials: true setting in interceptor
        return this.http.post<RefreshTokenResponse>(`${this.apiUrl}/refresh`, {}, { withCredentials: true }).pipe(
            tap(response => {
                if (response.success) {
                    localStorage.setItem(this.accessTokenKey, response.data.accessToken);
                }
            })
        );
    }

    private setSession(token: string, user: SafeGalleryUser) {
        localStorage.setItem(this.accessTokenKey, token);
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
    }

    private clearSession() {
        localStorage.removeItem(this.accessTokenKey);
        this.currentUser.set(null);
        this.isAuthenticated.set(false);
    }

    getToken(): string | null {
        return localStorage.getItem(this.accessTokenKey);
    }

    // Fetch current user helper
    getCurrentUser(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/me`).pipe(
            tap(response => {
                if (response.success) {
                    this.currentUser.set(response.data);
                    this.isAuthenticated.set(true);
                }
            }),
            catchError(err => {
                this.clearSession();
                return throwError(() => err);
            })
        );
    }

    forgotPassword(email: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/forgot-password`, { email });
    }

    resetPassword(password: string, token: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/reset-password`, { newPassword: password }, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    // OAuth Methods
    initiateOAuthLogin(provider: OAuthProvider): void {
        const returnUrl = window.location.pathname !== '/auth/login'
            && window.location.pathname !== '/auth/register'
            ? window.location.pathname
            : '/explore';
        localStorage.setItem('oauth_return_url', returnUrl);
        const apiUrl= this.apiUrl.replace('/gallery', '');
        window.location.href = `${apiUrl}/${provider}`;
    }

    handleOAuthCallback(token: string): Observable<any> {
        localStorage.setItem(this.accessTokenKey, token);
        this.isAuthenticated.set(true);
        return this.getCurrentUser();
    }

    getOAuthReturnUrl(): string {
        const url = localStorage.getItem('oauth_return_url') || '/explore';
        localStorage.removeItem('oauth_return_url');
        return url;
    }
}
