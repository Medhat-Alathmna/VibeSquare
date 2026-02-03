import { Injectable, signal, inject } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../api.service';
import { PrdService } from './prd.service';
import {
  AnalysisHistoryItem,
  IGalleryAnalysis,
  PaginatedResult,
  HistoryResponse,
  RecentAnalysesResponse,
  AnalysisDetailResponse,
  DeleteAnalysisResponse
} from '../models/history.model';
import {
  PrdListItem,
  PrdDetail,
  PrdListResponse,
  PrdDetailResponse,
  PrdDeleteResponse,
  PrdPaginationMeta
} from '../models/prd.model';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private apiService = inject(ApiService);
  private prdService = inject(PrdService);

  // State signals - Analysis History
  private historySignal = signal<PaginatedResult<AnalysisHistoryItem> | null>(null);
  private selectedAnalysisSignal = signal<IGalleryAnalysis | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // State signals - PRD History
  private prdListSignal = signal<PrdListItem[]>([]);
  private prdPaginationSignal = signal<PrdPaginationMeta | null>(null);
  private selectedPrdSignal = signal<PrdDetail | null>(null);
  private prdLoadingSignal = signal<boolean>(false);

  // Public readonly signals - Analysis
  readonly history = this.historySignal.asReadonly();
  readonly selectedAnalysis = this.selectedAnalysisSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // Public readonly signals - PRD
  readonly prdList = this.prdListSignal.asReadonly();
  readonly prdPagination = this.prdPaginationSignal.asReadonly();
  readonly selectedPrd = this.selectedPrdSignal.asReadonly();
  readonly prdLoading = this.prdLoadingSignal.asReadonly();

  /**
   * GET /api/gallery/analyze/history - Get paginated analysis history
   */
  getHistory(page: number = 1, limit: number = 20): Observable<HistoryResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.apiService.get<HistoryResponse>('gallery/analyze/history', {
      params: {
        page: page.toString(),
        limit: limit.toString()
      }
    }).pipe(
      tap(response => {
        if (response.success) {
          this.historySignal.set(response.data);
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
   * GET /api/gallery/analyze/recent - Get recent analyses
   */
  getRecent(limit: number = 5): Observable<RecentAnalysesResponse> {
    return this.apiService.get<RecentAnalysesResponse>('gallery/analyze/recent', {
      params: {
        limit: limit.toString()
      }
    });
  }

  /**
   * GET /api/gallery/analyze/:id - Get full analysis with prompt
   */
  getAnalysisById(id: string): Observable<AnalysisDetailResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.apiService.get<AnalysisDetailResponse>(`gallery/analyze/${id}`).pipe(
      tap(response => {
        if (response.success) {
          this.selectedAnalysisSignal.set(response.data);
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
   * DELETE /api/gallery/analyze/:id - Delete an analysis (soft delete)
   */
  deleteAnalysis(id: string): Observable<DeleteAnalysisResponse> {
    return this.apiService.delete<DeleteAnalysisResponse>(`gallery/analyze/${id}`).pipe(
      tap(() => {
        // Remove from local history if exists
        const currentHistory = this.historySignal();
        if (currentHistory) {
          this.historySignal.set({
            ...currentHistory,
            data: currentHistory.data.filter(item => item.id !== id),
            total: currentHistory.total - 1
          });
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.errorSignal.set(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  /**
   * Clear selected analysis
   */
  clearSelectedAnalysis(): void {
    this.selectedAnalysisSignal.set(null);
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  // ============ PRD History Methods ============

  /**
   * GET /api/prd - Get paginated PRD list (delegates to PrdService)
   */
  getPrdHistory(page: number = 1, limit: number = 10): Observable<PrdListResponse> {
    this.prdLoadingSignal.set(true);

    return this.prdService.getPrdList(page, limit).pipe(
      tap(response => {
        this.prdLoadingSignal.set(false);
        if (response.success || response.data) {
          this.prdListSignal.set(response.data.prds);
          this.prdPaginationSignal.set(response.data.pagination);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.prdLoadingSignal.set(false);
        this.errorSignal.set(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  /**
   * GET /api/prd/:id - Get PRD by ID (delegates to PrdService)
   */
  getPrdById(id: string): Observable<PrdDetailResponse> {
    this.prdLoadingSignal.set(true);

    return this.prdService.getPrdById(id).pipe(
      tap(response => {
        this.prdLoadingSignal.set(false);
        if (response.success || response.data) {
          this.selectedPrdSignal.set(response.data);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.prdLoadingSignal.set(false);
        this.errorSignal.set(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  /**
   * GET /api/prd/:id/download - Download PRD as markdown (delegates to PrdService)
   */
  downloadPrd(id: string): Observable<Blob> {
    return this.prdService.downloadPrd(id);
  }

  /**
   * DELETE /api/prd/:id - Delete PRD (delegates to PrdService)
   */
  deletePrd(id: string): Observable<PrdDeleteResponse> {
    return this.prdService.deletePrd(id).pipe(
      tap(() => {
        // Sync local state with PrdService's state update
        this.prdListSignal.update(prds => prds.filter(p => p.id !== id));
        // Update pagination count
        const pagination = this.prdPaginationSignal();
        if (pagination) {
          this.prdPaginationSignal.set({
            ...pagination,
            total: pagination.total - 1
          });
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.errorSignal.set(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  /**
   * Clear selected PRD
   */
  clearSelectedPrd(): void {
    this.selectedPrdSignal.set(null);
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 404) {
      return 'Analysis not found.';
    }
    if (error.status === 401) {
      return 'Please login to view your history.';
    }
    return error.error?.message || error.message || 'An error occurred.';
  }
}
