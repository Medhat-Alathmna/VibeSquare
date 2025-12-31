import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserProfileService } from '../../../../core/services/user-profile.service';
import { UserAnalysisItem, AnalysisStatus } from '../../../../core/models/user-profile.model';

@Component({
  selector: 'app-analysis-history-tab',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './analysis-history-tab.component.html',
  styleUrls: ['./analysis-history-tab.component.css']
})
export class AnalysisHistoryTabComponent implements OnInit {
  private userProfileService = inject(UserProfileService);

  analyses = this.userProfileService.analyses;
  analysesData = this.userProfileService.analysesData;
  isLoading = this.userProfileService.analysesLoading;
  error = this.userProfileService.analysesError;

  currentPage = signal(1);

  totalPages = computed(() => this.analysesData()?.totalPages || 1);
  totalItems = computed(() => this.analysesData()?.total || 0);
  hasNext = computed(() => this.currentPage() < this.totalPages());
  hasPrev = computed(() => this.currentPage() > 1);

  ngOnInit(): void {
    if (this.analyses().length === 0) {
      this.loadAnalyses();
    }
  }

  loadAnalyses(): void {
    this.userProfileService.getAnalyses(this.currentPage()).subscribe();
  }

  nextPage(): void {
    if (this.hasNext()) {
      this.currentPage.update(p => p + 1);
      this.loadAnalyses();
    }
  }

  prevPage(): void {
    if (this.hasPrev()) {
      this.currentPage.update(p => p - 1);
      this.loadAnalyses();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadAnalyses();
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatTokens(tokens: number): string {
    if (tokens >= 1000000) return (tokens / 1000000).toFixed(1) + 'M';
    if (tokens >= 1000) return (tokens / 1000).toFixed(0) + 'K';
    return tokens.toString();
  }

  getStatusClass(status: AnalysisStatus): string {
    const classes: Record<AnalysisStatus, string> = {
      completed: 'text-green-400 bg-green-400/10',
      processing: 'text-yellow-400 bg-yellow-400/10',
      pending: 'text-blue-400 bg-blue-400/10',
      failed: 'text-red-400 bg-red-400/10'
    };
    return classes[status] || 'text-gray-400 bg-gray-400/10';
  }

  getStatusLabel(status: AnalysisStatus): string {
    const labels: Record<AnalysisStatus, string> = {
      completed: 'Completed',
      processing: 'Processing',
      pending: 'Pending',
      failed: 'Failed'
    };
    return labels[status] || status;
  }

  truncateUrl(url: string, maxLength = 50): string {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
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
