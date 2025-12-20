import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { catchError, throwError } from 'rxjs';

@Component({
    selector: 'app-verify-email',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-4">
      <div class="max-w-md w-full bg-[#161616] p-8 rounded-xl border border-gray-800 shadow-xl text-center">
        
        <div *ngIf="isLoading">
          <h2 class="text-2xl font-bold mb-4">Verifying Email</h2>
          <div class="animate-spin text-purple-500 text-4xl mb-4">⟳</div>
          <p class="text-gray-400">Please wait while we verify your email address...</p>
        </div>

        <div *ngIf="!isLoading && success">
          <div class="text-green-500 text-5xl mb-4">✓</div>
          <h2 class="text-2xl font-bold mb-2">Email Verified!</h2>
          <p class="text-gray-400 mb-6">Your email has been successfully verified.</p>
          <a routerLink="/auth/login" class="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-8 rounded-lg transition-colors">
            Continue to Sign In
          </a>
        </div>

        <div *ngIf="!isLoading && !success">
          <div class="text-red-500 text-5xl mb-4">✗</div>
          <h2 class="text-2xl font-bold mb-2">Verification Failed</h2>
          <p class="text-gray-400 mb-6">{{ errorMessage }}</p>
          <a routerLink="/auth/login" class="text-purple-500 hover:text-purple-400 font-medium transition-colors">
            Return to Login
          </a>
        </div>

      </div>
    </div>
  `,
    styles: []
})
export class VerifyEmailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private authService = inject(AuthService);

    isLoading = true;
    success = false;
    errorMessage = '';

    ngOnInit() {
        const token = this.route.snapshot.queryParamMap.get('token');

        if (!token) {
            this.isLoading = false;
            this.success = false;
            this.errorMessage = 'Invalid verification link. Missing token.';
            return;
        }

        this.authService.verifyEmail({ token }).pipe(
            catchError(err => {
                this.isLoading = false;
                this.success = false;
                this.errorMessage = err.error?.message || 'Verification failed. Token may be expired.';
                return throwError(() => err);
            })
        ).subscribe(response => {
            this.isLoading = false;
            this.success = true;
        });
    }
}
