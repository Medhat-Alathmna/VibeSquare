import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserProfileService } from '../../../../core/services/user-profile.service';

@Component({
  selector: 'app-stats-tab',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './stats-tab.component.html',
  styleUrls: ['./stats-tab.component.css']
})
export class StatsTabComponent implements OnInit {
  private userProfileService = inject(UserProfileService);

  stats = this.userProfileService.stats;
  isLoading = this.userProfileService.statsLoading;
  error = this.userProfileService.statsError;

  // Computed values
  quotaPercentage = computed(() => {
    const s = this.stats();
    if (!s || s.quotaLimit === 0) return 0;
    const used = s.quotaLimit - s.quotaRemaining;
    return Math.round((used / s.quotaLimit) * 100);
  });

  quotaUsed = computed(() => {
    const s = this.stats();
    if (!s) return 0;
    return s.quotaLimit - s.quotaRemaining;
  });

  ngOnInit(): void {
    if (!this.stats()) {
      this.userProfileService.getStats().subscribe();
    }
  }

  formatNumber(num: number | undefined): string {
    if (num === undefined) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getResetTimeString(): string {
    const s = this.stats();
    if (!s?.quotaPeriodEnd) return '';

    const resetDate = new Date(s.quotaPeriodEnd);
    const now = new Date();
    const diffMs = resetDate.getTime() - now.getTime();

    if (diffMs <= 0) return 'Soon';

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  }

  refresh(): void {
    this.userProfileService.getStats().subscribe();
  }
}
