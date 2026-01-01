import { Injectable, signal, inject } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../api.service';
import {
  UserStats,
  UserStatsResponse,
  ActivityLogItem,
  ActivityLogResponse,
  ActivityLogData,
  UserAnalysisItem,
  UserAnalysesResponse,
  UserAnalysesData
} from '../models/user-profile.model';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private apiService = inject(ApiService);

  // ============================================
  // Stats State
  // ============================================
  private statsSignal = signal<UserStats | null>(null);
  private statsLoadingSignal = signal<boolean>(false);
  private statsErrorSignal = signal<string | null>(null);

  readonly stats = this.statsSignal.asReadonly();
  readonly statsLoading = this.statsLoadingSignal.asReadonly();
  readonly statsError = this.statsErrorSignal.asReadonly();

  // ============================================
  // Analyses State
  // ============================================
  private analysesSignal = signal<UserAnalysisItem[]>([]);
  private analysesDataSignal = signal<UserAnalysesData | null>(null);
  private analysesLoadingSignal = signal<boolean>(false);
  private analysesErrorSignal = signal<string | null>(null);

  readonly analyses = this.analysesSignal.asReadonly();
  readonly analysesData = this.analysesDataSignal.asReadonly();
  readonly analysesLoading = this.analysesLoadingSignal.asReadonly();
  readonly analysesError = this.analysesErrorSignal.asReadonly();

  // ============================================
  // Activity State
  // ============================================
  private activitySignal = signal<ActivityLogItem[]>([]);
  private activityDataSignal = signal<ActivityLogData | null>(null);
  private activityLoadingSignal = signal<boolean>(false);
  private activityErrorSignal = signal<string | null>(null);

  readonly activity = this.activitySignal.asReadonly();
  readonly activityData = this.activityDataSignal.asReadonly();
  readonly activityLoading = this.activityLoadingSignal.asReadonly();
  readonly activityError = this.activityErrorSignal.asReadonly();

  // ============================================
  // API Methods
  // ============================================

  /**
   * GET /api/gallery/users/me/stats - Fetch user stats
   */
  getStats(): Observable<UserStatsResponse> {
    this.statsLoadingSignal.set(true);
    this.statsErrorSignal.set(null);

    return this.apiService.get<UserStatsResponse>('gallery/users/me/stats').pipe(
      tap(response => {
        if (response.success) {
          this.statsSignal.set(response.data);
        }
        this.statsLoadingSignal.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        this.statsLoadingSignal.set(false);
        this.statsErrorSignal.set(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  /**
   * GET /api/gallery/users/me/analyses - Fetch user's analysis history
   */
  getAnalyses(page = 1, limit = 20): Observable<UserAnalysesResponse> {
    this.analysesLoadingSignal.set(true);
    this.analysesErrorSignal.set(null);

    return this.apiService.get<UserAnalysesResponse>('gallery/users/me/analyses', {
      params: { page: page.toString(), limit: limit.toString() }
    }).pipe(
      tap(response => {
        if (response.success) {
          this.analysesSignal.set(response.data.data);
          this.analysesDataSignal.set(response.data);
        }
        this.analysesLoadingSignal.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        this.analysesLoadingSignal.set(false);
        this.analysesErrorSignal.set(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  /**
   * GET /api/gallery/users/me/activity - Fetch user's activity log
   */
  getActivity(page = 1, limit = 50): Observable<ActivityLogResponse> {
    this.activityLoadingSignal.set(true);
    this.activityErrorSignal.set(null);

    return this.apiService.get<ActivityLogResponse>('gallery/users/me/activity', {
      params: { page: page.toString(), limit: limit.toString() }
    }).pipe(
      tap(response => {
        if (response.success) {
          this.activitySignal.set(response.data.data);
          this.activityDataSignal.set(response.data);
        }
        this.activityLoadingSignal.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        this.activityLoadingSignal.set(false);
        this.activityErrorSignal.set(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  /**
   * Clear all profile state (call on logout)
   */
  clearProfileState(): void {
    this.statsSignal.set(null);
    this.statsErrorSignal.set(null);

    this.analysesSignal.set([]);
    this.analysesDataSignal.set(null);
    this.analysesErrorSignal.set(null);

    this.activitySignal.set([]);
    this.activityDataSignal.set(null);
    this.activityErrorSignal.set(null);
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 401) {
      return 'Please login to view your profile.';
    }
    if (error.status === 404) {
      return 'Data not found.';
    }
    return error.error?.message || 'Failed to load data. Please try again.';
  }
}
