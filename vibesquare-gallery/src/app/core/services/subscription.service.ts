import { Injectable, signal, computed } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
    SubscriptionData,
    SubscriptionResponse,
    CheckoutRequest,
    CheckoutResponse,
    PortalRequest,
    PortalResponse,
    SubscriptionActionResponse
} from '../models/subscription.model';
import { ApiService } from '../api.service';

@Injectable({
    providedIn: 'root'
})
export class SubscriptionService {
    // State signals
    private subscriptionSignal = signal<SubscriptionData | null>(null);
    private loadingSignal = signal<boolean>(false);
    private errorSignal = signal<string | null>(null);

    // Public readonly signals
    readonly subscription = this.subscriptionSignal.asReadonly();
    readonly isLoading = this.loadingSignal.asReadonly();
    readonly error = this.errorSignal.asReadonly();

    // Computed signals
    readonly tier = computed(() => this.subscriptionSignal()?.tier ?? 'free');
    readonly isPremium = computed(() => this.tier() === 'pro');
    readonly isActive = computed(() => this.subscriptionSignal()?.status === 'active');
    readonly isCanceled = computed(() => this.subscriptionSignal()?.cancelAtPeriodEnd === true);

    readonly daysRemaining = computed(() => {
        const sub = this.subscriptionSignal();
        if (!sub?.currentPeriodEnd) return 0;

        const now = new Date();
        const end = new Date(sub.currentPeriodEnd);
        const diffMs = end.getTime() - now.getTime();

        return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    });

    readonly statusLabel = computed(() => {
        const sub = this.subscriptionSignal();
        if (!sub) return 'Free';

        if (sub.cancelAtPeriodEnd) {
            return 'Canceling';
        }

        switch (sub.status) {
            case 'active': return 'Active';
            case 'canceled': return 'Canceled';
            default: return 'Free';
        }
    });

    readonly upgradeInfo = computed(() => this.subscriptionSignal()?.upgrade ?? null);
    readonly canUpgrade = computed(() => this.upgradeInfo()?.available === true);

    constructor(private apiService: ApiService) { }

    /**
     * GET /subscription - Get subscription details
     */
    getSubscription(): Observable<SubscriptionResponse> {
        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        return this.apiService.get<SubscriptionResponse>('gallery/subscription').pipe(
            tap(response => {
                if (response.success) {
                    this.subscriptionSignal.set(response.data);
                }
                this.loadingSignal.set(false);
            }),
            catchError(error => {
                this.loadingSignal.set(false);
                this.errorSignal.set(error.message || 'Failed to fetch subscription');
                return throwError(() => error);
            })
        );
    }

    /**
     * POST /subscription/checkout - Create Stripe checkout session
     */
    createCheckout(): Observable<CheckoutResponse> {
        this.loadingSignal.set(true);

        const request: CheckoutRequest = {
            successUrl: `${window.location.origin}/subscription/success`,
            cancelUrl: `${window.location.origin}/subscription/cancel`
        };

        return this.apiService.post<CheckoutResponse>('gallery/subscription/checkout', request).pipe(
            tap(response => {
                this.loadingSignal.set(false);
                if (response.success && response.data.checkoutUrl) {
                    // Redirect to Stripe checkout
                    window.location.href = response.data.checkoutUrl;
                }
            }),
            catchError(error => {
                this.loadingSignal.set(false);
                this.errorSignal.set(error.message || 'Failed to create checkout session');
                return throwError(() => error);
            })
        );
    }

    /**
     * POST /subscription/portal - Create customer portal session
     */
    openPortal(): Observable<PortalResponse> {
        this.loadingSignal.set(true);

        const request: PortalRequest = {
            returnUrl: `${window.location.origin}/subscription`
        };

        return this.apiService.post<PortalResponse>('gallery/subscription/portal', request).pipe(
            tap(response => {
                this.loadingSignal.set(false);
                if (response.success && response.data.portalUrl) {
                    // Redirect to Stripe portal
                    window.location.href = response.data.portalUrl;
                }
            }),
            catchError(error => {
                this.loadingSignal.set(false);
                this.errorSignal.set(error.message || 'Failed to open customer portal');
                return throwError(() => error);
            })
        );
    }

    /**
     * POST /subscription/cancel - Cancel subscription at period end
     */
    cancelSubscription(): Observable<SubscriptionActionResponse> {
        this.loadingSignal.set(true);

        return this.apiService.post<SubscriptionActionResponse>('gallery/subscription/cancel', {}).pipe(
            tap(response => {
                this.loadingSignal.set(false);
                if (response.success) {
                    // Update local state
                    this.subscriptionSignal.update(current => {
                        if (!current) return current;
                        return { ...current, cancelAtPeriodEnd: true };
                    });
                }
            }),
            catchError(error => {
                this.loadingSignal.set(false);
                this.errorSignal.set(error.message || 'Failed to cancel subscription');
                return throwError(() => error);
            })
        );
    }

    /**
     * POST /subscription/reactivate - Reactivate subscription
     */
    reactivateSubscription(): Observable<SubscriptionActionResponse> {
        this.loadingSignal.set(true);

        return this.apiService.post<SubscriptionActionResponse>('gallery/subscription/reactivate', {}).pipe(
            tap(response => {
                this.loadingSignal.set(false);
                if (response.success) {
                    // Update local state
                    this.subscriptionSignal.update(current => {
                        if (!current) return current;
                        return { ...current, cancelAtPeriodEnd: false, status: 'active' };
                    });
                }
            }),
            catchError(error => {
                this.loadingSignal.set(false);
                this.errorSignal.set(error.message || 'Failed to reactivate subscription');
                return throwError(() => error);
            })
        );
    }

    /**
     * Refresh subscription state
     */
    refreshSubscription(): void {
        this.getSubscription().subscribe();
    }

    /**
     * Clear subscription state (on logout)
     */
    clearSubscription(): void {
        this.subscriptionSignal.set(null);
        this.errorSignal.set(null);
    }
}
