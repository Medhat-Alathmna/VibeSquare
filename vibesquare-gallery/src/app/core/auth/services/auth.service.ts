import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of, throwError } from 'rxjs';
import { LoginPayload, RegisterPayload, AuthResponse, SafeGalleryUser, RefreshTokenResponse, VerifyEmailPayload, OAuthProvider } from '../models/auth.models';
import { ApiService } from '../../api.service';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private accessTokenKey = 'gallery_access_token';
    private userKey = 'gallery_user';

    // Signal for current user state
    currentUser = signal<SafeGalleryUser | null>(null);
    isAuthenticated = signal<boolean>(false);

    constructor(private apiService: ApiService) {
        this.loadSession();
    }

    private loadSession() {
        const token = localStorage.getItem(this.accessTokenKey);
        const savedUser = localStorage.getItem(this.userKey);

        if (token) {
            this.isAuthenticated.set(true);

            // Load cached user immediately for UI
            if (savedUser) {
                try {
                    const user = JSON.parse(savedUser);
                    this.currentUser.set(user);
                } catch {
                    // Invalid JSON, ignore
                }
            }

            // Refresh user data from server in background
            this.getCurrentUser().subscribe({
                error: () => {
                    // Don't clear session on error - user data is still in localStorage
                    // Only clear if we get explicit 401 from /me endpoint
                }
            });
        }
    }

    login(payload: LoginPayload): Observable<AuthResponse> {
        return this.apiService.postGuest<AuthResponse>('gallery/auth/login', payload).pipe(
            tap(response => {
                if (response.success && response.data) {
                    this.setSession(response.data.accessToken, response.data.user);
                }
            })
        );
    }

    register(payload: RegisterPayload): Observable<AuthResponse> {
        return this.apiService.postGuest<AuthResponse>('gallery/auth/register', payload);
    }

    verifyEmail(payload: VerifyEmailPayload): Observable<any> {
        return this.apiService.postGuest('gallery/auth/verify-email', payload);
    }

    logout(): Observable<any> {
        return this.apiService.post('gallery/auth/logout', {}).pipe(
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
        return this.apiService.post<RefreshTokenResponse>('gallery/auth/refresh', {}, { withCredentials: true }).pipe(
            tap(response => {
                if (response.success) {
                    localStorage.setItem(this.accessTokenKey, response.data.accessToken);
                }
            })
        );
    }

    private setSession(token: string, user: SafeGalleryUser) {
        localStorage.setItem(this.accessTokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
    }

    private clearSession() {
        localStorage.removeItem(this.accessTokenKey);
        localStorage.removeItem(this.userKey);
        this.currentUser.set(null);
        this.isAuthenticated.set(false);
    }

    getToken(): string | null {
        return localStorage.getItem(this.accessTokenKey);
    }

    // Fetch current user helper
    getCurrentUser(): Observable<any> {
        return this.apiService.get<any>('gallery/auth/me').pipe(
            tap(response => {
                if (response.success) {
                    this.currentUser.set(response.data);
                    this.isAuthenticated.set(true);
                    // Update cached user data
                    localStorage.setItem(this.userKey, JSON.stringify(response.data));
                }
            }),
            catchError(err => {
                // Only clear session on 401 (unauthorized)
                if (err.status === 401) {
                    this.clearSession();
                }
                return throwError(() => err);
            })
        );
    }

    forgotPassword(email: string): Observable<any> {
        return this.apiService.postGuest('gallery/auth/forgot-password', { email });
    }

    resetPassword(password: string, token: string): Observable<any> {
        return this.apiService.postGuest('gallery/auth/reset-password', { newPassword: password }, {
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
        // Constructed to match previous logic: .../auth/{provider}
        // Previously: this.apiUrl.replace('/gallery', '') which was .../auth
        const authUrl = `${environment.apiUrl}/auth`;
        window.location.href = `${authUrl}/${provider}`;
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
