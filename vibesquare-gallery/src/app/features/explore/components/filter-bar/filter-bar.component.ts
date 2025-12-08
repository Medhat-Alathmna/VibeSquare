import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../../core/services/project.service';
import { SortOption } from '../../../../core/models/filter.model';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-bar.component.html',
  styleUrls: ['./filter-bar.component.css']
})
export class FilterBarComponent {
  private projectService = inject(ProjectService);

  sortOptions: { value: SortOption; label: string }[] = [
    { value: 'recent', label: 'Recent' },
    { value: 'popular', label: 'Popular' },
    { value: 'mostLiked', label: 'Most Liked' },
    { value: 'mostDownloaded', label: 'Most Downloaded' }
  ];

  currentSort = this.projectService.filterState;

  setSortOption(sortBy: SortOption) {
    this.projectService.updateFilters({ sortBy });
  }
}
