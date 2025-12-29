import { Injectable, signal, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
    AnalysisEstimate,
    AnalysisEstimateResponse,
    AnalysisConfirmRequest,
    AnalysisConfirmResponse,
    AnalysisResult,
    AnalysisState
} from '../models/analysis.model';
import { QuotaService } from './quota.service';
import { ApiService } from '../api.service';

@Injectable({
    providedIn: 'root'
})
export class AnalysisService {
    private apiService = inject(ApiService);
    private quotaService = inject(QuotaService);

    // State signals
    private stateSignal = signal<AnalysisState>('idle');
    private currentEstimateSignal = signal<AnalysisEstimate | null>(null);
    private currentResultSignal = signal<AnalysisResult | null>(null);
    private errorSignal = signal<string | null>(null);

    // Public readonly signals
    readonly state = this.stateSignal.asReadonly();
    readonly currentEstimate = this.currentEstimateSignal.asReadonly();
    readonly currentResult = this.currentResultSignal.asReadonly();
    readonly error = this.errorSignal.asReadonly();

    /**
     * POST /analyze/estimate - Estimate token cost before analysis
     */
    estimateAnalysis(url: string): Observable<AnalysisEstimateResponse> {
        this.stateSignal.set('estimating');
        this.errorSignal.set(null);
        this.currentEstimateSignal.set(null);
        
        return this.apiService.post<AnalysisEstimateResponse>('gallery/analyze/estimate', { url }).pipe(
            tap(response => {
                if (response.success) {
                    this.currentEstimateSignal.set(response.data);
                    this.stateSignal.set('confirming');
                }
            }),
            catchError((error: HttpErrorResponse) => {
                this.stateSignal.set('error');
                this.errorSignal.set(this.extractErrorMessage(error));
                return throwError(() => error);
            })
        );
    }

    /**
     * POST /analyze/confirm - Execute analysis with token deduction
     */
    confirmAnalysis(url: string, options?: AnalysisConfirmRequest['options']): Observable<AnalysisConfirmResponse> {
        this.stateSignal.set('analyzing');
        this.errorSignal.set(null);
        console.log(url);

        const request: AnalysisConfirmRequest = { url };
        if (options) {
            request.options = options;
        }

        return this.apiService.post<AnalysisConfirmResponse>('gallery/analyze/confirm', request).pipe(
            tap(response => {
                if (response.success) {
                    this.currentResultSignal.set(response.data);
                    this.stateSignal.set('completed');
                    // Refresh quota after successful analysis
                    this.quotaService.refreshQuota();
                }
            }),
            catchError((error: HttpErrorResponse) => {
                this.stateSignal.set('error');
                this.errorSignal.set(this.extractErrorMessage(error));
                return throwError(() => error);
            })
        );
    }

    /**
     * Reset state for new analysis
     */
    reset(): void {
        this.stateSignal.set('idle');
        this.currentEstimateSignal.set(null);
        this.currentResultSignal.set(null);
        this.errorSignal.set(null);
    }

    /**
     * Cancel current analysis flow
     */
    cancel(): void {
        this.stateSignal.set('idle');
        this.currentEstimateSignal.set(null);
        this.errorSignal.set(null);
    }

    /**
     * Check if currently analyzing
     */
    isAnalyzing(): boolean {
        const state = this.stateSignal();
        return state === 'estimating' || state === 'analyzing';
    }

    private extractErrorMessage(error: HttpErrorResponse): string {
        if (error.status === 402) {
            return 'Insufficient tokens. Please upgrade your subscription or wait for quota reset.';
        }
        if (error.status === 429) {
            return 'Too many requests. Please wait a moment and try again.';
        }
        if (error.status === 400) {
            return error.error?.message || 'Invalid URL. Please enter a valid website URL.';
        }
        return error.error?.message || error.message || 'An error occurred during analysis.';
    }
}
