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
    PrdCacheCheckResponse,
    PrdListItem,
    PrdDetail,
    PrdPaginationMeta,
    DetailLevel,
    // V2.5 Confidence & Fallback types
    ConfidenceData,
    AnalysisStatus,
    FallbackRequest,
    AgentConfidence,
    ApproveFallbackRequest,
    AnalysisV25StreamResponse,
    // V2.5 Preflight types
    PreflightRequest,
    PreflightResponse,
    PreflightData,
    PreflightState
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

    // V2.5 Confidence & Pipeline state signals
    private analysisStatusSignal = signal<AnalysisStatus>('idle');
    private confidenceSignal = signal<ConfidenceData | null>(null);
    private currentAgentSignal = signal<string | null>(null);
    private completedAgentsSignal = signal<AgentConfidence[]>([]);
    private fallbackRequestSignal = signal<FallbackRequest | null>(null);
    private resumeTokenSignal = signal<string | null>(null);
    private jobIdSignal = signal<string | null>(null);

    // V2.5 Preflight state signals
    private preflightStateSignal = signal<PreflightState>('idle');
    private preflightDataSignal = signal<PreflightData | null>(null);

    // Cache status signal
    private cacheStatusSignal = signal<{cached: boolean; cachedAt?: Date} | null>(null);

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

    // V2.5 Public readonly signals
    readonly analysisStatus = this.analysisStatusSignal.asReadonly();
    readonly confidence = this.confidenceSignal.asReadonly();
    readonly currentAgent = this.currentAgentSignal.asReadonly();
    readonly completedAgents = this.completedAgentsSignal.asReadonly();
    readonly fallbackRequest = this.fallbackRequestSignal.asReadonly();
    readonly resumeToken = this.resumeTokenSignal.asReadonly();
    readonly jobId = this.jobIdSignal.asReadonly();
    readonly cacheStatus = this.cacheStatusSignal.asReadonly();

    // V2.5 Preflight public readonly signals
    readonly preflightState = this.preflightStateSignal.asReadonly();
    readonly preflightData = this.preflightDataSignal.asReadonly();
    readonly preflightQuestions = computed(() => this.preflightDataSignal()?.questions ?? []);
    readonly preflightVisualSummary = computed(() => this.preflightDataSignal()?.visualSummary ?? null);
    readonly isPreflightLoading = computed(() => this.preflightStateSignal() === 'loading');

    // Computed signals
    readonly isAnalyzing = computed(() => this.stateSignal() === 'analyzing');
    readonly hasResult = computed(() => this.currentResultSignal() !== null);
    readonly hasPrds = computed(() => this.prdListSignal().length > 0);

    // V2.5 Computed signals
    readonly needsFallbackApproval = computed(() => this.analysisStatusSignal() === 'fallback_required');
    readonly overallConfidenceScore = computed(() => this.confidenceSignal()?.overallScore ?? 0);
    readonly hasLowConfidence = computed(() => this.overallConfidenceScore() < 70);
    readonly isCachedResult = computed(() => this.cacheStatusSignal()?.cached ?? false);

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

                    // Extract and save cache metadata
                    if (response.data.metadata) {
                        this.cacheStatusSignal.set({
                            cached: response.data.metadata.cached ?? false,
                            cachedAt: response.data.metadata.cachedAt
                        });
                    }

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

        return this.apiService.get<PrdListResponse>('gallery/prd', {
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

        return this.apiService.get<PrdDetailResponse>(`gallery/prd/${id}`).pipe(
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
        return this.apiService.getFile<Blob>(`gallery/prd/${id}/download`);
    }

    /**
     * DELETE /api/prd/:id - Delete PRD
     */
    deletePrd(id: string): Observable<PrdDeleteResponse> {
        return this.apiService.delete<PrdDeleteResponse>(`gallery/prd/${id}`).pipe(
            tap(() => {
                // Remove from local list
                this.prdListSignal.update(prds => prds.filter(p => p.id !== id));
            })
        );
    }

    /**
     * GET /api/gallery/prd/check-cache - Check if PRD is cached for URL
     */
    checkCache(url: string): Observable<PrdCacheCheckResponse> {
        return this.apiService.get<PrdCacheCheckResponse>('gallery/prd/check-cache', {
            params: { url }
        });
    }

    // ============================================
    // V2.5 Preflight & Fallback Methods
    // ============================================

    /**
     * POST /api/analyze/v2.5/preflight - Execute preflight visual analysis
     */
    preflight(url: string, forceRefresh = false): Observable<PreflightResponse> {
        this.preflightStateSignal.set('loading');
        this.preflightDataSignal.set(null);
        const request: PreflightRequest = { url, forceRefresh };
        return this.apiService.post<PreflightResponse>('analyze/v2.5/preflight', request).pipe(
            tap(response => {
                if (response.success || response.data) {
                    this.preflightDataSignal.set(response.data);
                    this.preflightStateSignal.set('completed');
                }
            }),
            catchError((error: HttpErrorResponse) => {
                this.preflightStateSignal.set('error');
                return throwError(() => error);
            })
        );
    }

    /**
     * POST /api/analyze/v25/approve-fallback - Approve or decline model fallback
     */
    approveFallback(approved: boolean, targetModel?: string): Observable<AnalysisV25StreamResponse> {
        const token = this.resumeTokenSignal();
        if (!token) {
            return throwError(() => new Error('No resume token available'));
        }

        this.analysisStatusSignal.set('running');
        this.fallbackRequestSignal.set(null);

        const request: ApproveFallbackRequest = {
            resumeToken: token,
            approved,
            targetModel
        };

        return this.apiService.post<AnalysisV25StreamResponse>('analyze/v25/approve-fallback', request).pipe(
            tap(response => this.handleStreamResponse(response)),
            catchError((error: HttpErrorResponse) => {
                this.analysisStatusSignal.set('error');
                this.errorSignal.set(this.extractErrorMessage(error));
                return throwError(() => error);
            })
        );
    }

    /**
     * Handle V2.5 stream response and update signals accordingly
     */
    private handleStreamResponse(response: AnalysisV25StreamResponse): void {
        this.analysisStatusSignal.set(response.status);
        this.jobIdSignal.set(response.jobId);

        if (response.resumeToken) {
            this.resumeTokenSignal.set(response.resumeToken);
            // Save to localStorage for resume capability
            this.savePendingAnalysis(response.resumeToken);
        }

        if (response.confidence) {
            this.confidenceSignal.set(response.confidence);
        }

        if (response.fallbackRequest) {
            this.fallbackRequestSignal.set(response.fallbackRequest);
        }

        if (response.status === 'completed' && response.result) {
            this.currentResultSignal.set(response.result);
            this.stateSignal.set('completed');
            this.progressSignal.set(100);
            this.clearPendingAnalysis();
            this.quotaService.refreshQuota();
        }

        if (response.status === 'error') {
            this.stateSignal.set('error');
            this.errorSignal.set(response.error || 'An error occurred');
            this.clearPendingAnalysis();
        }
    }

    /**
     * Update confidence data (used by SSE service)
     */
    updateConfidence(confidence: Partial<ConfidenceData>): void {
        const current = this.confidenceSignal();
        if (current) {
            this.confidenceSignal.set({ ...current, ...confidence });
        } else {
            this.confidenceSignal.set(confidence as ConfidenceData);
        }
    }

    /**
     * Update current agent (used by SSE service)
     */
    updateCurrentAgent(agentName: string | null): void {
        this.currentAgentSignal.set(agentName);
    }

    /**
     * Add completed agent (used by SSE service)
     */
    addCompletedAgent(agent: AgentConfidence): void {
        this.completedAgentsSignal.update(agents => [...agents, agent]);
    }

    /**
     * Set fallback request (used by SSE service)
     */
    setFallbackRequest(request: FallbackRequest): void {
        this.fallbackRequestSignal.set(request);
        this.analysisStatusSignal.set('fallback_required');
    }

    /**
     * Save pending analysis to localStorage for resume
     */
    private savePendingAnalysis(resumeToken: string): void {
        try {
            localStorage.setItem('pendingAnalysis', JSON.stringify({
                resumeToken,
                jobId: this.jobIdSignal(),
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('Failed to save pending analysis to localStorage', e);
        }
    }

    /**
     * Clear pending analysis from localStorage
     */
    private clearPendingAnalysis(): void {
        try {
            localStorage.removeItem('pendingAnalysis');
        } catch (e) {
            console.warn('Failed to clear pending analysis from localStorage', e);
        }
    }

    /**
     * Check for and restore pending analysis
     */
    checkPendingAnalysis(): { resumeToken: string; jobId: string; timestamp: number } | null {
        try {
            const saved = localStorage.getItem('pendingAnalysis');
            if (saved) {
                const data = JSON.parse(saved);
                // Only restore if less than 30 minutes old
                if (Date.now() - data.timestamp < 30 * 60 * 1000) {
                    return data;
                }
                this.clearPendingAnalysis();
            }
        } catch (e) {
            console.warn('Failed to check pending analysis', e);
        }
        return null;
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

        // Reset cache status
        this.cacheStatusSignal.set(null);

        // Reset V2.5 state
        this.analysisStatusSignal.set('idle');
        this.confidenceSignal.set(null);
        this.currentAgentSignal.set(null);
        this.completedAgentsSignal.set([]);
        this.fallbackRequestSignal.set(null);
        this.resumeTokenSignal.set(null);
        this.jobIdSignal.set(null);

        // Reset preflight state
        this.preflightStateSignal.set('idle');
        this.preflightDataSignal.set(null);
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
