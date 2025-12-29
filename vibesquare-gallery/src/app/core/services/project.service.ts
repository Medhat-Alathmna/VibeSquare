import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { Project } from '../models/project.model';
import { FilterState } from '../models/filter.model';
import {
  ApiResponse,
  ProjectsListData,
  ProjectsQueryParams,
  ProjectSearchParams,
  PaginationMeta,
  ProjectActionResponse,
  ProjectWithBuilder
} from '../models/api-response.model';
import { AuthService } from '../auth/services/auth.service';
import { ApiService } from '../api.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  // Signal-based state
  private allProjectsSignal = signal<Project[]>([]);
  private filterStateSignal = signal<FilterState>({
    searchQuery: '',
    frameworks: [],
    categories: [],
    tags: [],
    sortBy: 'recent'
  });

  // Pagination state
  private paginationSignal = signal<PaginationMeta | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly pagination = this.paginationSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // API now handles filtering, just return projects
  public filteredProjects = computed(() => this.allProjectsSignal());

  // Computed stats
  public totalProjects = computed(() => this.paginationSignal()?.total ?? this.allProjectsSignal().length);
  public activeFiltersCount = computed(() => {
    const filters = this.filterStateSignal();
    return filters.frameworks.length +
      filters.categories.length +
      filters.tags.length +
      (filters.searchQuery ? 1 : 0);
  });

  // Expose filter state signal (readonly)
  get filterState() {
    return this.filterStateSignal;
  }

  // ============ API Methods ============

  /**
   * GET /api/projects - List projects with pagination and filters
   */
  getProjects(params: ProjectsQueryParams = {}): Observable<ApiResponse<ProjectsListData>> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const queryParams = this.buildQueryParams(params);

    return this.apiService.get<ApiResponse<ProjectsListData>>('projects', {
      params: queryParams
    }).pipe(
      tap(response => {
        if (response.data) {
          this.allProjectsSignal.set(response.data.projects);
          this.paginationSignal.set(response.data.pagination);

          // Check favorites if authenticated
          if (this.authService.isAuthenticated() && response.data.projects.length > 0) {
            const ids = response.data.projects.map(p => p.id);
            this.checkMultipleFavorites(ids).subscribe();
          }
        }
        this.loadingSignal.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  /**
   * GET /api/projects/search - Search projects
   */
  searchProjects(params: ProjectSearchParams): Observable<ApiResponse<ProjectsListData>> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const queryParams = this.buildSearchParams(params);

    return this.apiService.get<ApiResponse<ProjectsListData>>('projects/search', {
      params: queryParams
    }).pipe(
      tap(response => {
        if (response.data) {
          this.allProjectsSignal.set(response.data.projects);
          this.paginationSignal.set(response.data.pagination);

          // Check favorites if authenticated
          if (this.authService.isAuthenticated() && response.data.projects.length > 0) {
            const ids = response.data.projects.map(p => p.id);
            this.checkMultipleFavorites(ids).subscribe();
          }
        }
        this.loadingSignal.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  /**
   * GET /api/projects/:id - Get single project from API
   */
  getProjectByIdFromApi(id: string): Observable<ApiResponse<ProjectWithBuilder>> {
    return this.apiService.get<ApiResponse<ProjectWithBuilder>>(`projects/${id}`);
  }

  /**
   * Get project from local cache (for quick access)
   */
  getProjectById(id: string): Project | undefined {
    return this.allProjectsSignal().find(p => p.id === id);
  }

  /**
   * POST /api/projects/:id/view - Record view
   */
  recordView(projectId: string): Observable<ProjectActionResponse> {
    return this.apiService.post<ProjectActionResponse>(`projects/${projectId}/view`, {}).pipe(
      tap(response => {
        if (response.data?.views !== undefined) {
          this.updateProjectStat(projectId, 'views', response.data.views);
        }
      }),
      catchError(error => {
        console.error('Failed to record view:', error);
        return of({ statusCode: 500, data: {}, message: 'Failed' } as ProjectActionResponse);
      })
    );
  }

  /**
   * POST /api/projects/:id/like - Record like
   */
  recordLike(projectId: string): Observable<ProjectActionResponse> {
    return this.apiService.post<ProjectActionResponse>(`projects/${projectId}/like`, {}).pipe(
      tap(response => {
        if (response.data?.likes !== undefined) {
          this.updateProjectStat(projectId, 'likes', response.data.likes);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error);
      })
    );
  }

  /**
   * POST /api/projects/:id/download - Record download
   */
  recordDownload(projectId: string): Observable<ProjectActionResponse> {
    return this.apiService.post<ProjectActionResponse>(`projects/${projectId}/download`, {}).pipe(
      tap(response => {
        if (response.data?.downloads !== undefined) {
          this.updateProjectStat(projectId, 'downloads', response.data.downloads);
        }
      }),
      catchError(error => {
        console.error('Failed to record download:', error);
        return of({ statusCode: 500, data: {}, message: 'Failed' } as ProjectActionResponse);
      })
    );
  }

  /**
   * Load more projects (append to existing - for infinite scroll/load more)
   */
  loadMoreProjects(): Observable<ApiResponse<ProjectsListData>> {
    const currentPagination = this.paginationSignal();
    if (!currentPagination?.hasMore) {
      return of({ statusCode: 200, data: { projects: [], pagination: currentPagination! }, message: 'No more' });
    }

    this.loadingSignal.set(true);
    const filters = this.filterStateSignal();
    const params: ProjectsQueryParams = {
      page: currentPagination.page + 1,
      limit: currentPagination.limit,
      sortBy: filters.sortBy
    };

    if (filters.frameworks.length > 0) {
      params.framework = filters.frameworks[0];
    }
    if (filters.categories.length > 0) {
      params.category = filters.categories[0];
    }

    return this.apiService.get<ApiResponse<ProjectsListData>>('projects', {
      params: this.buildQueryParams(params)
    }).pipe(
      tap(response => {
        if (response.data) {
          // Append projects
          this.allProjectsSignal.update(current => [...current, ...response.data.projects]);
          this.paginationSignal.set(response.data.pagination);

          // Check favorites for new projects
          if (this.authService.isAuthenticated() && response.data.projects.length > 0) {
            const ids = response.data.projects.map(p => p.id);
            this.checkMultipleFavorites(ids).subscribe();
          }
        }
        this.loadingSignal.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  // ============ Filter Methods ============

  /**
   * Update filters and trigger API call
   */
  updateFilters(filters: Partial<FilterState>) {
    this.filterStateSignal.update(current => ({
      ...current,
      ...filters
    }));

    // Trigger API call with new filters
    const currentFilters = this.filterStateSignal();

    if (currentFilters.searchQuery && currentFilters.searchQuery.length >= 2) {
      this.searchProjects({
        q: currentFilters.searchQuery,
        frameworks: currentFilters.frameworks.join(',') || undefined,
        categories: currentFilters.categories.join(',') || undefined,
        tags: currentFilters.tags.join(',') || undefined,
        sortBy: currentFilters.sortBy,
        page: 1,
        limit: 12
      }).subscribe();
    } else {
      const params: ProjectsQueryParams = {
        page: 1,
        limit: 12,
        sortBy: currentFilters.sortBy
      };

      if (currentFilters.frameworks.length > 0) {
        params.framework = currentFilters.frameworks[0];
      }
      if (currentFilters.categories.length > 0) {
        params.category = currentFilters.categories[0];
      }
      if (currentFilters.tags.length > 0) {
        params.tags = currentFilters.tags.join(',');
      }

      this.getProjects(params).subscribe();
    }
  }

  /**
   * Reset filters and reload projects
   */
  resetFilters() {
    this.filterStateSignal.set({
      searchQuery: '',
      frameworks: [],
      categories: [],
      tags: [],
      sortBy: 'recent'
    });
    this.getProjects({ page: 1, limit: 12 }).subscribe();
  }

  /**
   * Get current filter state
   */
  getCurrentFilters() {
    return this.filterStateSignal();
  }

  /**
   * Get all cached projects
   */
  getAllProjects() {
    return this.allProjectsSignal();
  }

  /**
   * Initial load - called from components
   */
  loadProjects() {
    this.getProjects({ page: 1, limit: 12 }).subscribe();
  }

  // ============ Favorites Logic ============

  addToFavorites(projectId: string): Observable<any> {
    return this.apiService.post<any>(`gallery/favorites/${projectId}`, {}).pipe(
      tap(() => this.updateProjectFavoriteStatus(projectId, true))
    );
  }

  removeFromFavorites(projectId: string): Observable<any> {
    return this.apiService.delete<any>(`gallery/favorites/${projectId}`).pipe(
      tap(() => this.updateProjectFavoriteStatus(projectId, false))
    );
  }

  checkFavoriteStatus(projectId: string): Observable<any> {
    return this.apiService.get<any>(`gallery/favorites/check/${projectId}`).pipe(
      tap((res: any) => {
        if (res.success) {
          this.updateProjectFavoriteStatus(projectId, res.data.isFavorited);
        }
      })
    );
  }

  checkMultipleFavorites(projectIds: string[]): Observable<any> {
    return this.apiService.post<any>('gallery/favorites/check-multiple', { projectIds }).pipe(
      tap((res: any) => {
        if (res.success && res.data) {
          const updates = res.data;
          this.allProjectsSignal.update(projects =>
            projects.map(p => ({
              ...p,
              isFavorited: updates[p.id] || false
            }))
          );
        }
      }),
      catchError(() => of(null))
    );
  }

  // ============ Private Helpers ============

  private updateProjectFavoriteStatus(projectId: string, isFavorited: boolean) {
    this.allProjectsSignal.update(projects =>
      projects.map(p =>
        p.id === projectId ? { ...p, isFavorited } : p
      )
    );
  }

  private updateProjectStat(projectId: string, stat: 'views' | 'likes' | 'downloads', newCount: number): void {
    this.allProjectsSignal.update(projects =>
      projects.map(p =>
        p.id === projectId ? { ...p, [stat]: newCount } : p
      )
    );
  }

  private buildQueryParams(params: ProjectsQueryParams): { [key: string]: string } {
    const query: { [key: string]: string } = {};

    if (params.page) query['page'] = params.page.toString();
    if (params.limit) query['limit'] = params.limit.toString();
    if (params.framework) query['framework'] = params.framework;
    if (params.category) query['category'] = params.category;
    if (params.tags) query['tags'] = params.tags;
    if (params.sortBy) query['sortBy'] = params.sortBy;

    return query;
  }

  private buildSearchParams(params: ProjectSearchParams): { [key: string]: string } {
    const query: { [key: string]: string } = {};

    if (params.q) query['q'] = params.q;
    if (params.frameworks) query['frameworks'] = params.frameworks;
    if (params.categories) query['categories'] = params.categories;
    if (params.tags) query['tags'] = params.tags;
    if (params.sortBy) query['sortBy'] = params.sortBy;
    if (params.page) query['page'] = params.page.toString();
    if (params.limit) query['limit'] = params.limit.toString();

    return query;
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 404) return 'Projects not found.';
    if (error.status === 400) return 'Invalid request.';
    return error.error?.message || 'Failed to load projects.';
  }
}
