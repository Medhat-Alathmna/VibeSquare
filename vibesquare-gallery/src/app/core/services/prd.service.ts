import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
    AnalysisV25Request,
    AnalysisV25Response,
    AnalysisV25Result,
    PrdListResponse,
    PrdDetailResponse,
    PrdDeleteResponse,
    PrdByUrlResponse,
    PrdListItem,
    PrdDetail,
    PrdPaginationMeta,
    DetailLevel
} from '../models/prd.model';
import { QuotaService } from './quota.service';
import { ApiService } from '../api.service';

export type PrdAnalysisState = 'idle' | 'analyzing' | 'completed' | 'error';

@Injectable({
    providedIn: 'root'
})
export class PrdService {
    private apiService = inject(ApiService);
    private quotaService = inject(QuotaService);

    // Analysis State signals
    private stateSignal = signal<PrdAnalysisState>('idle');
    private currentResultSignal = signal<AnalysisV25Result | null>(null);
    private errorSignal = signal<string | null>(null);
    private progressSignal = signal<number>(0);

    // PRD List state signals
    private prdListSignal = signal<PrdListItem[]>([]);
    private prdPaginationSignal = signal<PrdPaginationMeta | null>(null);
    private selectedPrdSignal = signal<PrdDetail | null>(null);
    private loadingSignal = signal<boolean>(false);

    // Progress simulation interval reference
    private progressInterval: ReturnType<typeof setInterval> | null = null;

    // Public readonly signals
    readonly state = this.stateSignal.asReadonly();
    readonly currentResult = this.currentResultSignal.asReadonly();
    readonly error = this.errorSignal.asReadonly();
    readonly progress = this.progressSignal.asReadonly();
    readonly prdList = this.prdListSignal.asReadonly();
    readonly prdPagination = this.prdPaginationSignal.asReadonly();
    readonly selectedPrd = this.selectedPrdSignal.asReadonly();
    readonly loading = this.loadingSignal.asReadonly();

    // Computed signals
    readonly isAnalyzing = computed(() => this.stateSignal() === 'analyzing');
    readonly hasResult = computed(() => this.currentResultSignal() !== null);
    readonly hasPrds = computed(() => this.prdListSignal().length > 0);

    /**
     * POST /api/analyze/v2.5 - Execute V2.5 analysis
     */
    analyzeV25(request: AnalysisV25Request): Observable<AnalysisV25Response> {
        this.stateSignal.set('analyzing');
        this.errorSignal.set(null);
        this.progressSignal.set(0);
        this.currentResultSignal.set(null);

        // Start progress simulation for long-running requests
        this.startProgressSimulation(request.detailLevel);

        return this.apiService.post<AnalysisV25Response>('analyze/v2.5', request).pipe(
            tap(response => {
                this.stopProgressSimulation();
                if (response.success || response.data) {
                    this.currentResultSignal.set(response.data);
                    this.stateSignal.set('completed');
                    this.progressSignal.set(100);
                    // Refresh quota after successful analysis
                    this.quotaService.refreshQuota();
                }
            }),
            catchError((error: HttpErrorResponse) => {
                this.stopProgressSimulation();
                this.stateSignal.set('error');
                this.progressSignal.set(0);
                this.errorSignal.set(this.extractErrorMessage(error));
                return throwError(() => error);
            })
        );
    }

    /**
     * GET /api/prd - List user's PRDs with pagination
     */
    getPrdList(page: number = 1, limit: number = 10): Observable<PrdListResponse> {
        this.loadingSignal.set(true);

        return this.apiService.get<PrdListResponse>('prd', {
            params: { page: page.toString(), limit: limit.toString() }
        }).pipe(
            tap(response => {
                this.loadingSignal.set(false);
                if (response.success || response.data) {
                    this.prdListSignal.set(response.data.prds);
                    this.prdPaginationSignal.set(response.data.pagination);
                }
            }),
            catchError((error: HttpErrorResponse) => {
                this.loadingSignal.set(false);
                return throwError(() => error);
            })
        );
    }

    /**
     * GET /api/prd/:id - Get PRD by ID
     */
    getPrdById(id: string): Observable<PrdDetailResponse> {
        this.loadingSignal.set(true);

        return this.apiService.get<PrdDetailResponse>(`prd/${id}`).pipe(
            tap(response => {
                this.loadingSignal.set(false);
                if (response.success || response.data) {
                    this.selectedPrdSignal.set(response.data);
                }
            }),
            catchError((error: HttpErrorResponse) => {
                this.loadingSignal.set(false);
                return throwError(() => error);
            })
        );
    }

    /**
     * GET /api/prd/:id/download - Download PRD as markdown file
     */
    downloadPrd(id: string): Observable<Blob> {
        return this.apiService.getFile<Blob>(`prd/${id}/download`);
    }

    /**
     * DELETE /api/prd/:id - Delete PRD
     */
    deletePrd(id: string): Observable<PrdDeleteResponse> {
        return this.apiService.delete<PrdDeleteResponse>(`prd/${id}`).pipe(
            tap(() => {
                // Remove from local list
                this.prdListSignal.update(prds => prds.filter(p => p.id !== id));
            })
        );
    }

    /**
     * GET /api/prd/by-url - Search PRDs by URL
     */
    searchPrdByUrl(url: string): Observable<PrdByUrlResponse> {
        return this.apiService.get<PrdByUrlResponse>('prd/by-url', {
            params: { url }
        });
    }

    /**
     * Reset analysis state for new analysis
     */
    reset(): void {
        this.stopProgressSimulation();
        this.stateSignal.set('idle');
        this.currentResultSignal.set(null);
        this.errorSignal.set(null);
        this.progressSignal.set(0);
    }

    /**
     * Cancel current analysis
     */
    cancel(): void {
        this.stopProgressSimulation();
        this.stateSignal.set('idle');
        this.errorSignal.set(null);
        this.progressSignal.set(0);
    }

    /**
     * Clear selected PRD
     */
    clearSelectedPrd(): void {
        this.selectedPrdSignal.set(null);
    }

    /**
     * Refresh PRD list (re-fetch current page)
     */
    refreshPrdList(): void {
        const pagination = this.prdPaginationSignal();
        if (pagination) {
            this.getPrdList(pagination.page, pagination.limit).subscribe();
        } else {
            this.getPrdList().subscribe();
        }
    }

    /**
     * Start progress simulation for UX during long processing
     * Progress goes from 0 to 90, then waits for actual completion
     */
    private startProgressSimulation(detailLevel: DetailLevel): void {
        this.stopProgressSimulation();

        // Estimated durations in ms based on detail level
        const durations: Record<DetailLevel, number> = {
            basic: 45000,      // 45 seconds
            detailed: 75000,   // 75 seconds
            comprehensive: 120000  // 120 seconds
        };

        const totalDuration = durations[detailLevel];
        const updateInterval = 500; // Update every 500ms
        const totalSteps = totalDuration / updateInterval;
        let currentStep = 0;

        this.progressInterval = setInterval(() => {
            if (this.stateSignal() !== 'analyzing') {
                this.stopProgressSimulation();
                return;
            }

            currentStep++;
            // Use easing function for natural feel, max at 90%
            const progress = Math.min(90, this.easeOutQuad(currentStep / totalSteps) * 90);
            this.progressSignal.set(Math.round(progress));

            if (currentStep >= totalSteps) {
                this.stopProgressSimulation();
            }
        }, updateInterval);
    }

    /**
     * Stop progress simulation
     */
    private stopProgressSimulation(): void {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    /**
     * Easing function for natural progress feel
     */
    private easeOutQuad(t: number): number {
        return t * (2 - t);
    }

    /**
     * Extract user-friendly error message from HTTP error
     */
    private extractErrorMessage(error: HttpErrorResponse): string {
        switch (error.status) {
            case 400:
                return error.error?.message || 'Invalid request. Please check your URL and try again.';
            case 401:
                return 'Please login to continue.';
            case 402:
                return 'Insufficient tokens. Please upgrade your subscription or wait for quota reset.';
            case 403:
                return 'Access denied. Please check your subscription tier.';
            case 404:
                return 'PRD not found.';
            case 408:
            case 504:
                return 'Analysis timed out. Try with a simpler website or lower detail level.';
            case 429:
                return 'Too many requests. Please wait a moment and try again.';
            case 500:
                return error.error?.message || 'Server error. Please try again later.';
            case 503:
                return 'Service temporarily unavailable. Please try again later.';
            default:
                return error.error?.message || error.message || 'An unexpected error occurred.';
        }
    }
}
