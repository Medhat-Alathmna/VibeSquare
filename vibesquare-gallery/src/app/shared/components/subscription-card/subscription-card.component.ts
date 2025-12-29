import { Component, inject, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { QuotaService } from '../../../core/services/quota.service';
import { ButtonComponent } from '../button/button.component';

@Component({
    selector: 'app-subscription-card',
    standalone: true,
    imports: [CommonModule, ButtonComponent],
    templateUrl: './subscription-card.component.html',
    styleUrls: ['./subscription-card.component.css']
})
export class SubscriptionCardComponent implements OnInit {
    private subscriptionService = inject(SubscriptionService);
    private quotaService = inject(QuotaService);

    // Inputs
    showActions = input<boolean>(true);
    compact = input<boolean>(false);

    // Service signals
    subscription = this.subscriptionService.subscription;
    tier = this.subscriptionService.tier;
    isPremium = this.subscriptionService.isPremium;
    isActive = this.subscriptionService.isActive;
    isCanceled = this.subscriptionService.isCanceled;
    daysRemaining = this.subscriptionService.daysRemaining;
    statusLabel = this.subscriptionService.statusLabel;
    isLoading = this.subscriptionService.isLoading;
    canUpgrade = this.subscriptionService.canUpgrade;
    upgradeInfo = this.subscriptionService.upgradeInfo;

    // Quota signals
    tokensRemaining = this.quotaService.tokensRemaining;
    tokensLimit = this.quotaService.tokensLimit;
    usagePercentage = this.quotaService.usagePercentage;

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

    onUpgrade(): void {
        this.subscriptionService.createCheckout().subscribe();
    }

    onManage(): void {
        this.subscriptionService.openPortal().subscribe();
    }

    onCancel(): void {
        if (confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.')) {
            this.subscriptionService.cancelSubscription().subscribe();
        }
    }

    onReactivate(): void {
        this.subscriptionService.reactivateSubscription().subscribe();
    }
}
