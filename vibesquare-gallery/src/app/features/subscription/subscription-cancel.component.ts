import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
    selector: 'app-subscription-cancel',
    standalone: true,
    imports: [CommonModule, ButtonComponent],
    template: `
        <div class="min-h-screen bg-dark-bg flex items-center justify-center p-4">
            <div class="max-w-md w-full text-center">
                <!-- Icon -->
                <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <svg class="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>

                <!-- Title -->
                <h1 class="text-3xl font-display font-bold text-white mb-4">
                    Checkout Cancelled
                </h1>

                <!-- Description -->
                <p class="text-gray-400 mb-8">
                    No worries! Your checkout was cancelled and you weren't charged. You can try again whenever you're ready.
                </p>

                <!-- Actions -->
                <div class="flex flex-col sm:flex-row gap-4">
                    <app-button variant="outline" class="flex-1" (click)="goToSubscription()">
                        View Plans
                    </app-button>
                    <app-button variant="primary" class="flex-1" (click)="goToExplore()">
                        Continue Exploring
                    </app-button>
                </div>
            </div>
        </div>
    `,
    styles: []
})
export class SubscriptionCancelComponent {
    private router = inject(Router);

    goToSubscription(): void {
        this.router.navigate(['/subscription']);
    }

    goToExplore(): void {
        this.router.navigate(['/explore']);
    }
}
