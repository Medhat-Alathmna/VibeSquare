import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserProfileService } from '../../../../core/services/user-profile.service';
import { ActivityAction, ActivityLogItem } from '../../../../core/models/user-profile.model';

@Component({
  selector: 'app-activity-tab',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './activity-tab.component.html',
  styleUrls: ['./activity-tab.component.css']
})
export class ActivityTabComponent implements OnInit {
  private userProfileService = inject(UserProfileService);

  activity = this.userProfileService.activity;
  activityData = this.userProfileService.activityData;
  isLoading = this.userProfileService.activityLoading;
  error = this.userProfileService.activityError;

  currentPage = signal(1);

  totalPages = computed(() => this.activityData()?.totalPages || 1);
  totalItems = computed(() => this.activityData()?.total || 0);
  hasNext = computed(() => this.currentPage() < this.totalPages());
  hasPrev = computed(() => this.currentPage() > 1);

  ngOnInit(): void {
    if (this.activity().length === 0) {
      this.loadActivity();
    }
  }

  loadActivity(): void {
    this.userProfileService.getActivity(this.currentPage()).subscribe();
  }

  nextPage(): void {
    if (this.hasNext()) {
      this.currentPage.update(p => p + 1);
      this.loadActivity();
    }
  }

  prevPage(): void {
    if (this.hasPrev()) {
      this.currentPage.update(p => p - 1);
      this.loadActivity();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadActivity();
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
      }
      return diffHours === 1 ? '1h ago' : `${diffHours}h ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getActivityIcon(action: ActivityAction): string {
    const icons: Record<ActivityAction, string> = {
      login: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1',
      logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
      download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
      favorite: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      unfavorite: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      view: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      ai_use: 'M13 10V3L4 14h7v7l9-11h-7z',
      profile_update: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
    };
    return icons[action] || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
  }

  getActivityColor(action: ActivityAction): string {
    const colors: Record<ActivityAction, string> = {
      login: 'text-green-400 bg-green-400/10',
      logout: 'text-gray-400 bg-gray-400/10',
      download: 'text-blue-400 bg-blue-400/10',
      favorite: 'text-pink-400 bg-pink-400/10',
      unfavorite: 'text-gray-400 bg-gray-400/10',
      view: 'text-purple-400 bg-purple-400/10',
      ai_use: 'text-yellow-400 bg-yellow-400/10',
      profile_update: 'text-cyan-400 bg-cyan-400/10'
    };
    return colors[action] || 'text-gray-400 bg-gray-400/10';
  }

  getActivityLabel(action: ActivityAction): string {
    const labels: Record<ActivityAction, string> = {
      login: 'Logged in',
      logout: 'Logged out',
      download: 'Downloaded',
      favorite: 'Favorited',
      unfavorite: 'Unfavorited',
      view: 'Viewed',
      ai_use: 'AI Analysis',
      profile_update: 'Profile updated'
    };
    return labels[action] || action;
  }

  getPaginationRange(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const range: number[] = [];

    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);

    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(total, start + 4);
      } else {
        start = Math.max(1, end - 4);
      }
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    return range;
  }
}
