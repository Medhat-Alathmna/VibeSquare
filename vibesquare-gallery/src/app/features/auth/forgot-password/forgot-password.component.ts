import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { catchError, throwError } from 'rxjs';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    template: `
    <div class="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-4">
      <div class="max-w-md w-full bg-[#161616] p-8 rounded-xl border border-gray-800 shadow-xl">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold mb-2">Reset Password</h2>
          <p class="text-gray-400">Enter your email to receive a reset link</p>
        </div>

        <div *ngIf="successMessage" class="p-4 bg-green-900/30 border border-green-900 rounded-lg text-green-200 text-center mb-6">
          {{ successMessage }}
        </div>

        <form *ngIf="!successMessage" [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email"
              class="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              placeholder="your@email.com"
            >
             <p *ngIf="forgotForm.get('email')?.touched && forgotForm.get('email')?.invalid" class="mt-1 text-sm text-red-500">
              Valid email is required
            </p>
          </div>

          <div *ngIf="errorMessage" class="p-3 bg-red-900/30 border border-red-900 rounded-lg text-red-200 text-sm">
            {{ errorMessage }}
          </div>

          <button 
            type="submit" 
            [disabled]="forgotForm.invalid || isLoading"
            class="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span *ngIf="isLoading" class="mr-2 animate-spin">⟳</span>
            {{ isLoading ? 'Sending Link...' : 'Send Reset Link' }}
          </button>
        </form>

        <div class="flex flex-col gap-3 text-center text-sm text-gray-400 mt-6">
          <a routerLink="/auth/login" class="text-purple-500 hover:text-purple-400 font-medium transition-colors">Back to Sign In</a>
        </div>
      </div>
    </div>
  `,
    styles: []
})
export class ForgotPasswordComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);

    forgotForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]]
    });

    isLoading = false;
    errorMessage = '';
    successMessage = '';

    onSubmit() {
        if (this.forgotForm.invalid) return;

        this.isLoading = true;
        this.errorMessage = '';

        const { email } = this.forgotForm.value;

        this.authService.forgotPassword(email!).pipe(
            catchError(err => {
                this.isLoading = false;
                this.errorMessage = err.error?.message || 'Failed to send reset link. Please try again.';
                return throwError(() => err);
            })
        ).subscribe(response => {
            this.isLoading = false;
            if (response.success) {
                this.successMessage = 'If an account exists with this email, a password reset link has been sent.';
            }
        });
    }
}
