import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService } from '../../core/services/subscription.service';
import { QuotaService } from '../../core/services/quota.service';
import { SubscriptionCardComponent } from '../../shared/components/subscription-card/subscription-card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

interface PricingTier {
    name: string;
    price: number;
    interval: 'month' | 'year';
    tokens: number;
    features: string[];
    recommended?: boolean;
    current?: boolean;
}

@Component({
    selector: 'app-subscription',
    standalone: true,
    imports: [CommonModule, SubscriptionCardComponent, ButtonComponent],
    templateUrl: './subscription.component.html',
    styleUrls: ['./subscription.component.css']
})
export class SubscriptionComponent implements OnInit {
    private subscriptionService = inject(SubscriptionService);
    private quotaService = inject(QuotaService);

    subscription = this.subscriptionService.subscription;
    isPremium = this.subscriptionService.isPremium;
    isLoading = this.subscriptionService.isLoading;

    selectedInterval = signal<'month' | 'year'>('month');

    tiers: PricingTier[] = [
        {
            name: 'Free',
            price: 0,
            interval: 'month',
            tokens: 100000,
            features: [
                '100,000 tokens per week',
                'Basic website analysis',
                'Community support',
                'Standard processing'
            ],
            current: true
        },
        {
            name: 'Pro',
            price: 9.99,
            interval: 'month',
            tokens: 400000,
            features: [
                '400,000 tokens per week',
                'Advanced analysis features',
                'Priority processing',
                'Email support',
                'Analysis history',
                'No ads'
            ],
            recommended: true
        }
    ];

    ngOnInit(): void {
        this.subscriptionService.getSubscription().subscribe();
        this.quotaService.getQuota().subscribe();
    }

    formatNumber(num: number): string {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(0) + 'K';
        }
        return num.toLocaleString();
    }

    getPrice(tier: PricingTier): number {
        if (this.selectedInterval() === 'year' && tier.price > 0) {
            return tier.price * 10; // 2 months free
        }
        return tier.price;
    }

    onSelectPlan(tier: PricingTier): void {
        if (tier.price === 0) return; // Can't select free plan
        this.subscriptionService.createCheckout().subscribe();
    }

    onToggleInterval(): void {
        this.selectedInterval.update(i => i === 'month' ? 'year' : 'month');
    }
}
