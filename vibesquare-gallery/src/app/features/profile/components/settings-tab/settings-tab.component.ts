import { Component, inject, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { UserService } from '../../../../core/auth/services/user.service';

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
}
