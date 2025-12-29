import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SubscriptionService } from '../../core/services/subscription.service';
import { QuotaService } from '../../core/services/quota.service';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
    selector: 'app-subscription-success',
    standalone: true,
    imports: [CommonModule, ButtonComponent],
    template: `
        <div class="min-h-screen bg-dark-bg flex items-center justify-center p-4">
            <div class="max-w-md w-full text-center">
                <!-- Success Icon -->
                <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg class="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                </div>

                <!-- Title -->
                <h1 class="text-3xl font-display font-bold text-white mb-4">
                    Welcome to Pro!
                </h1>

                <!-- Description -->
                <p class="text-gray-400 mb-8">
                    Your subscription has been activated successfully. You now have access to 400,000 tokens per week and all premium features.
                </p>

                <!-- Features -->
                <div class="bg-dark-surface border border-dark-border rounded-xl p-6 mb-8 text-left">
                    <h3 class="text-sm font-medium text-gray-400 mb-4">Your Pro Benefits:</h3>
                    <ul class="space-y-3">
                        <li class="flex items-center gap-3 text-white">
                            <svg class="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            400,000 tokens per week
                        </li>
                        <li class="flex items-center gap-3 text-white">
                            <svg class="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            Priority processing
                        </li>
                        <li class="flex items-center gap-3 text-white">
                            <svg class="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            Email support
                        </li>
                    </ul>
                </div>

                <!-- CTA -->
                <app-button variant="primary" [fullWidth]="true" (click)="goToExplore()">
                    Start Analyzing
                </app-button>
            </div>
        </div>
    `,
    styles: []
})
export class SubscriptionSuccessComponent implements OnInit {
    private router = inject(Router);
    private subscriptionService = inject(SubscriptionService);
    private quotaService = inject(QuotaService);

    ngOnInit(): void {
        // Refresh subscription and quota data
        this.subscriptionService.refreshSubscription();
        this.quotaService.refreshQuota();
    }

    goToExplore(): void {
        this.router.navigate(['/explore']);
    }
}
