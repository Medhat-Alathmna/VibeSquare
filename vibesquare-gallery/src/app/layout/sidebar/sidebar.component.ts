import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { Framework, Category } from '../../core/models/project.model';
import { SortOption } from '../../core/models/filter.model';

interface SidebarSection {
  id: string;
  title: string;
  icon: string;
  isExpanded: boolean;
}

interface BottomAction {
  id: string;
  label: string;
  icon: string;
  route?: string;
  action?: () => void;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  private projectService = inject(ProjectService);

  isCollapsed = signal(true);

  // Collapsible sections state
  sections = signal<SidebarSection[]>([
    { id: 'sorts', title: 'Sorts', icon: 'sort', isExpanded: true },
    { id: 'filters', title: 'Filters', icon: 'filter', isExpanded: false },
    { id: 'community', title: 'Community', icon: 'community', isExpanded: false }
  ]);

  // Sort options
  sortOptions: { value: SortOption; label: string }[] = [
    { value: 'recent', label: 'Recent' },
    { value: 'popular', label: 'Popular' },
    { value: 'mostLiked', label: 'Most Liked' },
    { value: 'mostDownloaded', label: 'Most Downloaded' }
  ];

  // Current sort from service
  currentSort = this.projectService.filterState;

  // Filter options
  frameworks: Framework[] = ['Angular', 'React', 'Vue', 'Svelte', 'Next.js', 'Nuxt.js', 'Vanilla'];
  categories: Category[] = ['Dashboard', 'Landing Page', 'E-commerce', 'Portfolio', 'Blog', 'Admin Panel', 'SaaS', 'Other'];

  // Community links
  communityLinks = [
    { id: 'chat', label: 'Chat', icon: 'chat', route: '/chat' },
    { id: 'blog', label: 'Blog', icon: 'blog', route: '/blog' }
  ];

  // Bottom actions
  bottomActions: BottomAction[] = [
    { id: 'help', label: 'Help', icon: 'help', route: '/help' },
    { id: 'updates', label: 'Updates', icon: 'updates', route: '/updates' },
    { id: 'account', label: 'Account', icon: 'account', route: '/account' }
  ];

  // Selected filters (signals)
  selectedFrameworks = signal<Framework[]>([]);
  selectedCategories = signal<Category[]>([]);

  toggleSection(sectionId: string) {
    this.sections.update(sections =>
      sections.map(section =>
        section.id === sectionId
          ? { ...section, isExpanded: !section.isExpanded }
          : section
      )
    );
  }

  isSectionExpanded(sectionId: string): boolean {
    return this.sections().find(s => s.id === sectionId)?.isExpanded ?? false;
  }

  toggleFramework(framework: Framework) {
    this.selectedFrameworks.update(current => {
      const exists = current.includes(framework);
      const updated = exists
        ? current.filter(f => f !== framework)
        : [...current, framework];

      this.projectService.updateFilters({ frameworks: updated });
      return updated;
    });
  }

  toggleCategory(category: Category) {
    this.selectedCategories.update(current => {
      const exists = current.includes(category);
      const updated = exists
        ? current.filter(c => c !== category)
        : [...current, category];

      this.projectService.updateFilters({ categories: updated });
      return updated;
    });
  }

  clearAllFilters() {
    this.selectedFrameworks.set([]);
    this.selectedCategories.set([]);
    this.projectService.resetFilters();
  }

  setSortOption(sortBy: SortOption) {
    this.projectService.updateFilters({ sortBy });
  }

  toggleSidebar() {
    this.isCollapsed.update(v => !v);
  }
}
