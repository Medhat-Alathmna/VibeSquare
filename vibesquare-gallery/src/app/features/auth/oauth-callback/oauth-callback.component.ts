import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { catchError, throwError } from 'rxjs';

@Component({
    selector: 'app-oauth-callback',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-4">
      <div class="max-w-md w-full bg-[#161616] p-8 rounded-xl border border-gray-800 shadow-xl text-center">

        <!-- Loading State -->
        <div *ngIf="isLoading">
          <h2 class="text-2xl font-bold mb-4">Completing Sign In</h2>
          <div class="animate-spin text-purple-500 text-4xl mb-4">&#x27F3;</div>
          <p class="text-gray-400">Please wait while we complete your authentication...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="!isLoading && errorMessage">
          <div class="text-red-500 text-5xl mb-4">&#x2717;</div>
          <h2 class="text-2xl font-bold mb-2">Authentication Failed</h2>
          <p class="text-gray-400 mb-6">{{ errorMessage }}</p>
          <a routerLink="/auth/login"
             class="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-8 rounded-lg transition-colors">
            Return to Login
          </a>
        </div>

      </div>
    </div>
  `
})
export class OAuthCallbackComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private authService = inject(AuthService);

    isLoading = true;
    errorMessage = '';

    ngOnInit() {
        console.log('[OAuth Callback] Component initialized');

        const token = this.route.snapshot.queryParamMap.get('token');
        const error = this.route.snapshot.queryParamMap.get('error');
        const errorDescription = this.route.snapshot.queryParamMap.get('error_description');
        const status = this.route.snapshot.queryParamMap.get('status');
        const message = this.route.snapshot.queryParamMap.get('message');

        console.log('[OAuth Callback] Query params:', { token: token ? 'present' : 'missing', error, errorDescription, status, message });

        // Check if opened in popup (has opener window)
        const isPopup = window.opener && !window.opener.closed;
        console.log('[OAuth Callback] Is popup:', isPopup);

        // Handle 409 Conflict (email already exists)
        if (status === '409') {
            this.handleConflict(message || 'Email already exists', isPopup);
            return;
        }

        if (error) {
            this.handleError(errorDescription || error || 'Authentication failed. Please try again.', isPopup);
            return;
        }

        if (!token) {
            this.handleError('No authentication token received. Please try again.', isPopup);
            return;
        }

        // Handle success
        this.handleSuccess(token, isPopup);
    }

    private handleConflict(message: string, isPopup: boolean): void {
        console.log('[OAuth Callback] Email conflict detected');
        this.isLoading = false;

        if (isPopup) {
            console.log('[OAuth Callback] Sending conflict message to parent window...');
            window.opener.postMessage({
                type: 'OAUTH_EMAIL_CONFLICT',
                message: message
            }, window.location.origin);
            console.log('[OAuth Callback] Conflict message sent, closing in 1 second...');
            setTimeout(() => window.close(), 1000);
        } else {
            this.errorMessage = message;
            setTimeout(() => {
                this.router.navigate(['/auth/login'], {
                    queryParams: { conflict: 'email_exists' }
                });
            }, 2000);
        }
    }

    private handleError(errorMsg: string, isPopup: boolean): void {
        console.error('[OAuth Callback] Error:', errorMsg);
        this.isLoading = false;
        this.errorMessage = errorMsg;

        if (isPopup) {
            console.log('[OAuth Callback] Sending error to parent window...');
            window.opener.postMessage({
                type: 'OAUTH_ERROR',
                error: this.errorMessage
            }, window.location.origin);
            console.log('[OAuth Callback] Error sent, closing in 2 seconds...');
            setTimeout(() => window.close(), 2000);
        }
    }

    private handleSuccess(token: string, isPopup: boolean): void {
        console.log('[OAuth Callback] Success! Token received');

        if (isPopup) {
            console.log('[OAuth Callback] Sending success message to parent window...');
            window.opener.postMessage({
                type: 'OAUTH_SUCCESS',
                token: token
            }, window.location.origin);
            console.log('[OAuth Callback] Success message sent');

            this.isLoading = false;
            console.log('[OAuth Callback] Popup will close in 1 second...');
            setTimeout(() => {
                console.log('[OAuth Callback] Closing popup now');
                window.close();
            }, 1000);
        } else {
            // Fallback: if not in popup, handle normally
            this.authService.handleOAuthCallback(token).pipe(
                catchError(err => {
                    this.isLoading = false;
                    this.errorMessage = err.error?.message || 'Failed to complete authentication. Please try again.';
                    return throwError(() => err);
                })
            ).subscribe({
                next: () => {
                    this.isLoading = false;
                    const returnUrl = this.authService.getOAuthReturnUrl();
                    this.router.navigateByUrl(returnUrl);
                }
            });
        }
    }
}
