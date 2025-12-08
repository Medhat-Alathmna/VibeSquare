import { Injectable, signal, computed } from '@angular/core';
import { Project, Framework, Category } from '../models/project.model';
import { FilterState, SortOption } from '../models/filter.model';
const PROJECTS_DATA_URL = '../../assets/data/projects.json';
@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  // Signal-based state
  private allProjectsSignal = signal<Project[]>([]);
  private filterStateSignal = signal<FilterState>({
    searchQuery: '',
    frameworks: [],
    categories: [],
    tags: [],
    sortBy: 'recent'
  });

  // Computed filtered and sorted projects
  public filteredProjects = computed(() => {
    const projects = this.allProjectsSignal();
    const filters = this.filterStateSignal();

    let filtered = projects;

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply framework filter
    if (filters.frameworks.length > 0) {
      filtered = filtered.filter(p =>
        filters.frameworks.includes(p.framework)
      );
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(p =>
        filters.categories.includes(p.category)
      );
    }

    // Apply tag filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(p =>
        filters.tags.some(tag => p.tags.includes(tag))
      );
    }

    // Apply sorting
    return this.sortProjects(filtered, filters.sortBy);
  });

  // Computed stats
  public totalProjects = computed(() => this.allProjectsSignal().length);
  public activeFiltersCount = computed(() => {
    const filters = this.filterStateSignal();
    return filters.frameworks.length +
           filters.categories.length +
           filters.tags.length +
           (filters.searchQuery ? 1 : 0);
  });

  constructor() {
    this.loadProjectsInternal();
  }

  // Update filter state
  updateFilters(filters: Partial<FilterState>) {
    this.filterStateSignal.update(current => ({
      ...current,
      ...filters
    }));
  }

  // Get single project
  getProjectById(id: string): Project | undefined {
    return this.allProjectsSignal().find(p => p.id === id);
  }

  // Sort helper
  private sortProjects(projects: Project[], sortBy: SortOption): Project[] {
    const sorted = [...projects];

    switch (sortBy) {
      case 'recent':
        return sorted.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'popular':
        return sorted.sort((a, b) => b.views - a.views);
      case 'mostLiked':
        return sorted.sort((a, b) => b.likes - a.likes);
      case 'mostDownloaded':
        return sorted.sort((a, b) => b.downloads - a.downloads);
      default:
        return sorted;
    }
  }

  // Reset filters
  resetFilters() {
    this.filterStateSignal.set({
      searchQuery: '',
      frameworks: [],
      categories: [],
      tags: [],
      sortBy: 'recent'
    });
  }

  // Get current filter state (readonly)
  getCurrentFilters() {
    return this.filterStateSignal();
  }

  // Get all projects (readonly)
  getAllProjects() {
    return this.allProjectsSignal();
  }

  // Expose filter state signal (readonly)
  get filterState() {
    return this.filterStateSignal;
  }

  // Make loadProjects public for manual loading
  public loadProjects() {
    this.loadProjectsInternal();
  }

  private async loadProjectsInternal() {
    try {
      console.log(PROJECTS_DATA_URL);
      
      const response = await fetch(PROJECTS_DATA_URL);
      const projects = await response.json();
      this.allProjectsSignal.set(projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }
}
