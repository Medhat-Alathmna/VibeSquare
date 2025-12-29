import { Injectable, signal, inject } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../api.service';
import {
  AnalysisHistoryItem,
  IGalleryAnalysis,
  PaginatedResult,
  HistoryResponse,
  RecentAnalysesResponse,
  AnalysisDetailResponse,
  DeleteAnalysisResponse
} from '../models/history.model';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private apiService = inject(ApiService);

  // State signals
  private historySignal = signal<PaginatedResult<AnalysisHistoryItem> | null>(null);
  private selectedAnalysisSignal = signal<IGalleryAnalysis | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly history = this.historySignal.asReadonly();
  readonly selectedAnalysis = this.selectedAnalysisSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

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
