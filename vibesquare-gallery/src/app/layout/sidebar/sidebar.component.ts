import { Component, signal, inject, HostListener, ElementRef, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { QuotaService } from '../../core/services/quota.service';
import { AuthService } from '../../core/auth/services/auth.service';
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
export class SidebarComponent implements OnInit {
  private projectService = inject(ProjectService);
  private quotaService = inject(QuotaService);
  private authService = inject(AuthService);
  private elementRef = inject(ElementRef);
  private router = inject(Router);

  isCollapsed = signal(true);

  // Hover expand functionality
  private hoverTimeout: ReturnType<typeof setTimeout> | null = null;
  private isHoverExpanded = false;

  // Auth signals
  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.currentUser;

  // Quota signals
  quota = this.quotaService.quota;
  tokensRemaining = this.quotaService.tokensRemaining;
  tokensLimit = this.quotaService.tokensLimit;
  usagePercentage = this.quotaService.usagePercentage;
  resetTimeString = this.quotaService.resetTimeString;
  isPremium = this.quotaService.isPremium;
  isQuotaLoading = this.quotaService.isLoading;

  // Progress bar color based on usage
  progressColor = computed(() => {
    const percentage = this.usagePercentage();
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-secondary';
  });

  ngOnInit(): void {
    // Load quota if authenticated
    if (this.isAuthenticated()) {
      this.quotaService.getQuota().subscribe();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Only close if sidebar is expanded and click is outside
    if (!this.isCollapsed() && !this.elementRef.nativeElement.contains(event.target)) {
      this.isCollapsed.set(true);
    }
  }

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
    this.isHoverExpanded = false;
  }

  onSidebarMouseEnter(): void {
    // Only trigger hover expand if sidebar is collapsed
    if (this.isCollapsed()) {
      this.hoverTimeout = setTimeout(() => {
        this.isCollapsed.set(false);
        this.isHoverExpanded = true;
      }, 500); // 1 second delay
    }
  }

  onSidebarMouseLeave(): void {
    // Clear the timeout if mouse leaves before 1 second
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    // Collapse only if it was expanded by hover
    if (this.isHoverExpanded) {
      this.isCollapsed.set(true);
      this.isHoverExpanded = false;
    }
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  }

  onAccountClick(): void {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
    } else {
      this.router.navigate(['/profile']);
    }
  }
}
