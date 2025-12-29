import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HistoryService } from '../../core/services/history.service';
import { AnalysisHistoryItem, IGalleryAnalysis } from '../../core/models/history.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  private historyService = inject(HistoryService);

  // Service signals
  history = this.historyService.history;
  selectedAnalysis = this.historyService.selectedAnalysis;
  isLoading = this.historyService.isLoading;
  error = this.historyService.error;

  // Local state
  currentPage = signal(1);
  itemsPerPage = signal(10);
  showModal = signal(false);
  loadingAnalysisId = signal<string | null>(null);
  deletingId = signal<string | null>(null);
  copySuccess = signal(false);

  // Computed
  analyses = computed(() => this.history()?.data || []);
  totalPages = computed(() => this.history()?.totalPages || 1);
  totalItems = computed(() => this.history()?.total || 0);
  hasNext = computed(() => this.currentPage() < this.totalPages());
  hasPrev = computed(() => this.currentPage() > 1);

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.historyService.getHistory(this.currentPage(), this.itemsPerPage()).subscribe();
  }

  nextPage(): void {
    if (this.hasNext()) {
      this.currentPage.update(p => p + 1);
      this.loadHistory();
    }
  }

  prevPage(): void {
    if (this.hasPrev()) {
      this.currentPage.update(p => p - 1);
      this.loadHistory();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadHistory();
    }
  }

  viewAnalysis(analysis: AnalysisHistoryItem): void {
    this.loadingAnalysisId.set(analysis.id);
    this.historyService.getAnalysisById(analysis.id).subscribe({
      next: () => {
        this.loadingAnalysisId.set(null);
        this.showModal.set(true);
      },
      error: () => {
        this.loadingAnalysisId.set(null);
      }
    });
  }

  closeModal(): void {
    this.showModal.set(false);
    this.historyService.clearSelectedAnalysis();
  }

  deleteAnalysis(id: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this analysis?')) {
      this.deletingId.set(id);
      this.historyService.deleteAnalysis(id).subscribe({
        next: () => {
          this.deletingId.set(null);
        },
        error: () => {
          this.deletingId.set(null);
        }
      });
    }
  }

  copyPrompt(prompt: string): void {
    navigator.clipboard.writeText(prompt).then(() => {
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    });
  }

  copyFromList(analysis: AnalysisHistoryItem, event: Event): void {
    event.stopPropagation();
    this.loadingAnalysisId.set(analysis.id);
    this.historyService.getAnalysisById(analysis.id).subscribe({
      next: (response) => {
        this.loadingAnalysisId.set(null);
        if (response.data.prompt) {
          this.copyPrompt(response.data.prompt);
        }
      },
      error: () => {
        this.loadingAnalysisId.set(null);
      }
    });
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
        return diffMins <= 1 ? 'Just now' : `${diffMins} min ago`;
      }
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  }

  formatTokens(tokens: number): string {
    if (tokens >= 1000000) {
      return (tokens / 1000000).toFixed(1) + 'M';
    }
    if (tokens >= 1000) {
      return (tokens / 1000).toFixed(0) + 'K';
    }
    return tokens.toString();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'processing': return 'text-yellow-400';
      case 'pending': return 'text-blue-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  }

  getStatusBgColor(status: string): string {
    switch (status) {
      case 'completed': return 'bg-green-400/10';
      case 'processing': return 'bg-yellow-400/10';
      case 'pending': return 'bg-blue-400/10';
      case 'failed': return 'bg-red-400/10';
      default: return 'bg-gray-400/10';
    }
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
