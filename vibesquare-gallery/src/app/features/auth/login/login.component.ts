import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { SocialLoginButtonsComponent } from '../components/social-login-buttons/social-login-buttons.component';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, SocialLoginButtonsComponent],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    loginForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]]
    });

    isLoading = false;
    errorMessage = '';

    onSubmit() {
        if (this.loginForm.invalid) return;

        this.isLoading = true;
        this.errorMessage = '';

        const { email, password } = this.loginForm.value;

        this.authService.login({ email: email!, password: password! }).subscribe({
            next: (response) => {
                this.isLoading = false;
                if (response.success) {
                    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/explore';
                    this.router.navigateByUrl(returnUrl);
                } else {
                    this.errorMessage = response.message || 'Login failed. Please try again.';
                }
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = err.error?.message || 'Login failed. Please try again.';
            }
        });
    }
}
