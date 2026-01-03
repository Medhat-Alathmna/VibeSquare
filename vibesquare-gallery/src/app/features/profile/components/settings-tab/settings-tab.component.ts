import { Component, inject, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-settings-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings-tab.component.html',
  styleUrls: ['./settings-tab.component.css']
})
export class SettingsTabComponent {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  currentUser = this.authService.currentUser;

  profileForm = this.fb.group({
    bio: ['', [Validators.maxLength(500)]],
    socialLinks: this.fb.group({
      twitter: [''],
      linkedin: [''],
      github: [''],
      portfolio: ['']
    })
  });

  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  isLinkingGoogle = signal(false);

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

  get bioLength(): number {
    return this.profileForm.get('bio')?.value?.length || 0;
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;

    this.isLoading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const formValue = this.profileForm.value;

    this.userService.updateProfile(formValue as any).subscribe({
      next: (res) => {
        if (res.success) {
          this.successMessage.set('Profile updated successfully');
          this.authService.getCurrentUser().subscribe();
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to update profile');
        this.isLoading.set(false);
      }
    });
  }

  clearMessages(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  linkGoogle(): void {
    this.isLinkingGoogle.set(true);

    // Initiate OAuth flow
    this.authService.initiateOAuthLogin('google');

    // Listen for success/failure
    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'OAUTH_SUCCESS') {
        this.toastService.success('Google account linked successfully!');
        this.authService.getCurrentUser().subscribe();
      } else if (event.data.type === 'OAUTH_ERROR') {
        this.toastService.error('Failed to link Google account');
      }

      this.isLinkingGoogle.set(false);
      window.removeEventListener('message', messageHandler);
    };

    window.addEventListener('message', messageHandler);
  }

  unlinkGoogle(): void {
    if (!confirm('Are you sure you want to unlink your Google account?')) {
      return;
    }

    this.isLinkingGoogle.set(true);

    this.userService.unlinkProvider('google').subscribe({
      next: () => {
        this.toastService.success('Google account unlinked');
        this.authService.getCurrentUser().subscribe();
        this.isLinkingGoogle.set(false);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to unlink');
        this.isLinkingGoogle.set(false);
      }
    });
  }
}
