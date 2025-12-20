import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { catchError, throwError } from 'rxjs';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    template: `
    <div class="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-4">
      <div class="max-w-md w-full bg-[#161616] p-8 rounded-xl border border-gray-800 shadow-xl">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold mb-2">Set New Password</h2>
          <p class="text-gray-400">Choose a strong password for your account</p>
        </div>

        <div *ngIf="!token" class="p-4 bg-red-900/30 border border-red-900 rounded-lg text-red-200 text-center">
          Invalid or missing reset token. Please request a new link.
        </div>

        <form *ngIf="token" [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <div>
            <label for="password" class="block text-sm font-medium text-gray-400 mb-2">New Password</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password"
              class="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              placeholder="Min 8 chars"
            >
            <p *ngIf="resetForm.get('password')?.touched && resetForm.get('password')?.errors?.['required']" class="mt-1 text-sm text-red-500">
              Password is required
            </p>
            <p *ngIf="resetForm.get('password')?.touched && resetForm.get('password')?.errors?.['minlength']" class="mt-1 text-sm text-red-500">
              Password must be at least 8 characters
            </p>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-400 mb-2">Confirm Password</label>
            <input 
              type="password" 
              id="confirmPassword" 
              formControlName="confirmPassword"
              class="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              placeholder="Min 8 chars"
            >
             <p *ngIf="resetForm.get('confirmPassword')?.touched && resetForm.errors?.['mismatch']" class="mt-1 text-sm text-red-500">
              Passwords do not match
            </p>
          </div>

          <div *ngIf="errorMessage" class="p-3 bg-red-900/30 border border-red-900 rounded-lg text-red-200 text-sm">
            {{ errorMessage }}
          </div>

          <button 
            type="submit" 
            [disabled]="resetForm.invalid || isLoading"
            class="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span *ngIf="isLoading" class="mr-2 animate-spin">⟳</span>
            {{ isLoading ? 'Resetting...' : 'Reset Password' }}
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
export class ResetPasswordComponent implements OnInit {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    resetForm = this.fb.group({
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    isLoading = false;
    errorMessage = '';
    token: string | null = null;

    ngOnInit() {
        this.token = this.route.snapshot.queryParamMap.get('token');
    }

    passwordMatchValidator(g: any) {
        return g.get('password')?.value === g.get('confirmPassword')?.value
            ? null
            : { mismatch: true };
    }

    onSubmit() {
        if (this.resetForm.invalid || !this.token) return;

        this.isLoading = true;
        this.errorMessage = '';

        const { password } = this.resetForm.value;

        this.authService.resetPassword(password!, this.token).pipe(
            catchError(err => {
                this.isLoading = false;
                this.errorMessage = err.error?.message || 'Password reset failed. Token may be invalid or expired.';
                return throwError(() => err);
            })
        ).subscribe(response => {
            this.isLoading = false;
            if (response.success) {
                this.router.navigate(['/auth/login'], { queryParams: { reset: 'true' } });
            }
        });
    }
}
