import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { SocialLoginButtonsComponent } from '../components/social-login-buttons/social-login-buttons.component';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, SocialLoginButtonsComponent],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);

    registerForm = this.fb.group({
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    isLoading = false;
    errorMessage = '';

    passwordMatchValidator(g: any) {
        return g.get('password')?.value === g.get('confirmPassword')?.value
            ? null
            : { mismatch: true };
    }

    onSubmit() {
        if (this.registerForm.invalid) return;

        this.isLoading = true;
        this.errorMessage = '';

        const { username, email, password } = this.registerForm.value;

        this.authService.register({ username: username!, email: email!, password: password! }).subscribe({
            next: (response) => {
                this.isLoading = false;
                if (response.success) {
                    // Redirect to login or show success message suggesting to verify email
                    this.router.navigate(['/auth/login'], { queryParams: { registered: 'true' } });
                } else {
                    // Handle case where backend returns 200 with success: false
                    this.errorMessage = response.message || 'Registration failed. Please try again.';
                }
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
            },complete:()=>{
                this.isLoading = false;
            }
        });
    }
}
