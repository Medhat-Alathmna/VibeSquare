import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserProfileService } from '../../../../core/services/user-profile.service';
import { ProjectService } from '../../../../core/services/project.service';
import { FavoriteProject } from '../../../../core/models/user-profile.model';

@Component({
  selector: 'app-favorites-tab',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './favorites-tab.component.html',
  styleUrls: ['./favorites-tab.component.css']
})
export class FavoritesTabComponent implements OnInit {
  private userProfileService = inject(UserProfileService);
  private projectService = inject(ProjectService);

  favorites = this.userProfileService.favorites;
  favoritesData = this.userProfileService.favoritesData;
  isLoading = this.userProfileService.favoritesLoading;
  error = this.userProfileService.favoritesError;

  currentPage = signal(1);
  removingId = signal<string | null>(null);

  totalPages = computed(() => this.favoritesData()?.totalPages || 1);
  totalItems = computed(() => this.favoritesData()?.total || 0);
  hasNext = computed(() => this.currentPage() < this.totalPages());
  hasPrev = computed(() => this.currentPage() > 1);

  ngOnInit(): void {
    if (this.favorites().length === 0) {
      this.loadFavorites();
    }
  }

  loadFavorites(): void {
    this.userProfileService.getFavorites(this.currentPage()).subscribe();
  }

  nextPage(): void {
    if (this.hasNext()) {
      this.currentPage.update(p => p + 1);
      this.loadFavorites();
    }
  }

  prevPage(): void {
    if (this.hasPrev()) {
      this.currentPage.update(p => p - 1);
      this.loadFavorites();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadFavorites();
    }
  }

  removeFavorite(favorite: FavoriteProject, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!favorite.project) return;

    this.removingId.set(favorite.id);
    this.projectService.removeFromFavorites(favorite.project.id).subscribe({
      next: () => {
        this.removingId.set(null);
        this.userProfileService.refreshFavorites(this.currentPage());
      },
      error: () => {
        this.removingId.set(null);
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
