import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SafeGalleryUser } from '../../../../core/auth/models/auth.models';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile-header.component.html',
  styleUrls: ['./profile-header.component.css']
})
export class ProfileHeaderComponent {
  @Input() user: SafeGalleryUser | null = null;
  @Output() logoutClick = new EventEmitter<void>();

  getInitial(): string {
    return this.user?.username?.charAt(0)?.toUpperCase() || '?';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  }

  getTierLabel(): string {
    return this.user?.subscriptionTier === 'pro' ? 'Pro' : 'Free';
  }

  getTierClass(): string {
    return this.user?.subscriptionTier === 'pro'
      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
      : 'bg-gray-800 text-gray-300';
  }

  hasSocialLinks(): boolean {
    const links = this.user?.socialLinks;
    if (!links) return false;
    return !!(links.twitter || links.linkedin || links.github || links.portfolio);
  }

  onLogout(): void {
    this.logoutClick.emit();
  }
}
