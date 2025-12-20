import { Component, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/services/auth.service';
import { UserService } from '../../core/auth/services/user.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './profile.component.html',
    styles: []
})
export class ProfileComponent {
    private authService = inject(AuthService);
    private userService = inject(UserService);
    private fb = inject(FormBuilder);

    currentUser = this.authService.currentUser;

    profileForm = this.fb.group({
        bio: [''],
        socialLinks: this.fb.group({
            twitter: [''],
            linkedin: [''],
            github: [''],
            portfolio: ['']
        })
    });

    isLoading = false;
    successMessage = '';
    errorMessage = '';

    constructor() {
        effect(() => {
            const user = this.currentUser();
            if (user) {
                this.profileForm.patchValue({
                    bio: user.bio || '',
                    socialLinks: {
                        twitter: user.socialLinks?.twitter || '',
                        linkedin: user.socialLinks?.linkedin || '',
                        github: user.socialLinks?.github || '',
                        portfolio: user.socialLinks?.portfolio || ''
                    }
                });
            }
        });
    }

    onSubmit() {
        if (this.profileForm.invalid) return;

        this.isLoading = true;
        this.successMessage = '';
        this.errorMessage = '';

        const formValue = this.profileForm.value;

        this.userService.updateProfile(formValue as any).subscribe({
            next: (res) => {
                if (res.success) {
                    this.successMessage = 'Profile updated successfully';
                    // Refresh local user data
                    this.authService.getCurrentUser().subscribe();
                }
                this.isLoading = false;
            },
            error: (err) => {
                this.errorMessage = 'Failed to update profile';
                this.isLoading = false;
            }
        });
    }

    logout() {
        this.authService.logout().subscribe(() => {
            // Router navigate usually handled in component or service, service sets state
            window.location.reload(); // Simple reload to clear state/redirect if guard kicks in
        });
    }
}
