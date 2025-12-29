import { Injectable, signal, computed } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
    TokenQuota,
    QuotaResponse,
    QuotaHistoryResponse,
    QuotaCheckResponse
} from '../models/quota.model';
import { ApiService } from '../api.service';

@Injectable({
    providedIn: 'root'
})
export class QuotaService {
    // Signals for state management
    private quotaSignal = signal<TokenQuota | null>(null);
    private loadingSignal = signal<boolean>(false);
    private errorSignal = signal<string | null>(null);

    // Public readonly signals
    readonly quota = this.quotaSignal.asReadonly();
    readonly isLoading = this.loadingSignal.asReadonly();
    readonly error = this.errorSignal.asReadonly();

    // Computed signals for convenience
    readonly tokensRemaining = computed(() => this.quotaSignal()?.quota.remaining ?? 0);
    readonly tokensUsed = computed(() => this.quotaSignal()?.quota.used ?? 0);
    readonly tokensLimit = computed(() => this.quotaSignal()?.quota.limit ?? 0);
    readonly usagePercentage = computed(() => {
        const quota = this.quotaSignal();
        if (!quota) return 0;
        return Math.round((quota.quota.used / quota.quota.limit) * 100);
    });
    readonly tier = computed(() => this.quotaSignal()?.tier ?? 'free');
    readonly isPremium = computed(() => this.tier() === 'pro');
    readonly isQuotaExceeded = computed(() => this.tokensRemaining() <= 0);

    // Time until reset
    readonly timeUntilReset = computed(() => {
        const quota = this.quotaSignal();
        if (!quota?.quota.periodEnd) return null;

        const now = new Date();
        const resetTime = new Date(quota.quota.periodEnd);
        const diffMs = resetTime.getTime() - now.getTime();

        if (diffMs <= 0) return { days: 0, hours: 0, minutes: 0 };

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        return { days, hours, minutes };
    });

    readonly resetTimeString = computed(() => {
        const time = this.timeUntilReset();
        if (!time) return '';

        if (time.days > 0) {
            return `${time.days}d ${time.hours}h`;
        }
        if (time.hours > 0) {
            return `${time.hours}h ${time.minutes}m`;
        }
        return `${time.minutes}m`;
    });

    constructor(private apiService: ApiService) { }

    /**
     * GET /quota - Fetch user's token quota status
     */
    getQuota(): Observable<QuotaResponse> {
        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        return this.apiService.get<QuotaResponse>('gallery/quota').pipe(
            tap(response => {
                if (response.success) {
                    this.quotaSignal.set(response.data);
                }
                this.loadingSignal.set(false);
            }),
            catchError(error => {
                this.loadingSignal.set(false);
                this.errorSignal.set(error.message || 'Failed to fetch quota');
                return throwError(() => error);
            })
        );
    }

    /**
     * GET /quota/history - Get token transaction history (paginated)
     */
    getHistory(page = 1, limit = 20): Observable<QuotaHistoryResponse> {
        return this.apiService.get<QuotaHistoryResponse>('gallery/quota/history', {
            params: { page: page.toString(), limit: limit.toString() }
        });
    }

    /**
     * POST /quota/check - Check if user has sufficient tokens
     */
    checkQuota(estimatedTokens: number): Observable<QuotaCheckResponse> {
        return this.apiService.post<QuotaCheckResponse>('gallery/quota/check', {
            estimatedTokens
        });
    }

    /**
     * Refresh quota after an action
     */
    refreshQuota(): void {
        this.getQuota().subscribe();
    }

    /**
     * Update quota locally after successful analysis (optimistic update)
     */
    deductTokensLocally(amount: number): void {
        this.quotaSignal.update(current => {
            if (!current) return current;
            const newUsed = current.quota.used + amount;
            const newRemaining = Math.max(0, current.quota.limit - newUsed);
            return {
                ...current,
                quota: {
                    ...current.quota,
                    used: newUsed,
                    remaining: newRemaining
                }
            };
        });
    }

    /**
     * Clear quota state (on logout)
     */
    clearQuota(): void {
        this.quotaSignal.set(null);
        this.errorSignal.set(null);
    }
}
