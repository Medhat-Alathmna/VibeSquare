import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, of, throwError } from 'rxjs';
import { LoginPayload, RegisterPayload, AuthResponse, SafeGalleryUser, RefreshTokenResponse, VerifyEmailPayload, OAuthProvider } from '../models/auth.models';
import { ApiService } from '../../api.service';
import { environment } from '../../../../environments/environment.production';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private accessTokenKey = 'gallery_access_token';
    private userKey = 'gallery_user';

    // Signal for current user state
    currentUser = signal<SafeGalleryUser | null>(null);
    isAuthenticated = signal<boolean>(false);

    constructor(
        private apiService: ApiService,
        private router: Router
    ) {
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
        console.log('[Auth] Fetching current user from /gallery/auth/me...');
        return this.apiService.get<any>('gallery/auth/me').pipe(
            tap(response => {
                console.log('[Auth] User data response:', response);
                if (response.success) {
                    console.log('[Auth] User authenticated successfully:', response.data.username);
                    this.currentUser.set(response.data);
                    this.isAuthenticated.set(true);
                    // Update cached user data
                    localStorage.setItem(this.userKey, JSON.stringify(response.data));
                } else {
                    console.warn('[Auth] User fetch response not successful:', response);
                }
            }),
            catchError(err => {
                console.error('[Auth] Failed to fetch current user:', err);
                console.error('[Auth] Error status:', err.status);
                console.error('[Auth] Error message:', err.message);
                // Only clear session on 401 (unauthorized)
                if (err.status === 401) {
                    console.warn('[Auth] Unauthorized (401), clearing session');
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
        console.log('[OAuth] Initiating OAuth login with provider:', provider);

        const returnUrl = window.location.pathname !== '/auth/login'
            && window.location.pathname !== '/auth/register'
            ? window.location.pathname
            : '/explore';
        localStorage.setItem('oauth_return_url', returnUrl);
        console.log('[OAuth] Return URL saved:', returnUrl);

        // OAuth URL
        const authUrl = `${environment.apiUrl}/gallery/auth`;
        const oauthUrl = `${authUrl}/${provider}`;
        console.log('[OAuth] OAuth URL:', oauthUrl);

        // Open OAuth in popup window
        const width = 500;
        const height = 600;
        const left = (window.innerWidth - width) / 2 + window.screenX;
        const top = (window.innerHeight - height) / 2 + window.screenY;

        console.log('[OAuth] Opening popup window...');
        const popup = window.open(
            oauthUrl,
            'OAuth Login',
            `width=${width},height=${height},left=${left},top=${top},popup=yes,toolbar=no,menubar=no,location=no,status=no`
        );

        if (!popup) {
            // Fallback to redirect if popup blocked
            console.warn('[OAuth] Popup blocked, falling back to redirect');
            window.location.href = oauthUrl;
            return;
        }

        console.log('[OAuth] Popup opened successfully');

        // Listen for message from popup
        const messageHandler = (event: MessageEvent) => {
            console.log('[OAuth] Message received:', event.data);

            // Verify origin for security
            if (event.origin !== window.location.origin) {
                console.warn('[OAuth] Message from invalid origin:', event.origin);
                return;
            }

            if (event.data.type === 'OAUTH_SUCCESS' && event.data.token) {
                console.log('[OAuth] Success! Processing token...');

                // Handle successful OAuth
                this.handleOAuthCallback(event.data.token).subscribe({
                    next: () => {
                        console.log('[OAuth] User data fetched successfully');
                        const url = this.getOAuthReturnUrl();
                        console.log('[OAuth] Navigating to:', url);

                        // Use Angular Router for smooth navigation (no page reload)
                        this.router.navigateByUrl(url).then(() => {
                            console.log('[OAuth] Navigation completed successfully');
                        });
                    },
                    error: (err) => {
                        console.error('[OAuth] Failed to fetch user data:', err);
                        console.error('[OAuth] Error details:', {
                            status: err.status,
                            message: err.message,
                            error: err.error
                        });
                        // Fallback navigation even on error
                        this.router.navigateByUrl('/auth/login?error=oauth_failed');
                    }
                });

                // Close popup and remove listener
                console.log('[OAuth] Closing popup...');
                if (popup && !popup.closed) {
                    popup.close();
                    console.log('[OAuth] Popup closed');
                }
                window.removeEventListener('message', messageHandler);
            } else if (event.data.type === 'OAUTH_ERROR') {
                console.error('[OAuth] Error received from popup:', event.data.error);
                if (popup && !popup.closed) {
                    popup.close();
                }
                window.removeEventListener('message', messageHandler);
                // Show error to user
                this.router.navigateByUrl('/auth/login?error=' + encodeURIComponent(event.data.error));
            }
        };

        window.addEventListener('message', messageHandler);

        // Check if popup was closed without completing OAuth
        const checkClosed = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkClosed);
                window.removeEventListener('message', messageHandler);
            }
        }, 500);
    }

    handleOAuthCallback(token: string): Observable<any> {
        console.log('[OAuth] Handling OAuth callback, storing token...');
        localStorage.setItem(this.accessTokenKey, token);
        this.isAuthenticated.set(true);
        console.log('[OAuth] Fetching current user data...');
        return this.getCurrentUser();
    }

    getOAuthReturnUrl(): string {
        const url = localStorage.getItem('oauth_return_url') || '/explore';
        localStorage.removeItem('oauth_return_url');
        return url;
    }
}
