import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="fixed bottom-4 right-4 z-[99999] flex flex-col gap-2 max-w-sm">
            @for (toast of toasts(); track toast.id) {
                <div
                    class="flex items-start gap-3 p-4 rounded-lg shadow-lg border backdrop-blur-sm animate-slide-in"
                    [ngClass]="getToastClasses(toast.type)"
                    role="alert">
                    <!-- Icon -->
                    <div class="flex-shrink-0">
                        @switch (toast.type) {
                            @case ('success') {
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                </svg>
                            }
                            @case ('error') {
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            }
                            @case ('warning') {
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                </svg>
                            }
                            @case ('loading') {
                                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            }
                            @default {
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            }
                        }
                    </div>

                    <!-- Message -->
                    <p class="flex-1 text-sm font-medium">{{ toast.message }}</p>

                    <!-- Close Button -->
                    <button
                        (click)="dismiss(toast.id)"
                        class="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            }
        </div>
    `,
    styles: [`
        @keyframes slide-in {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }

        .animate-slide-in {
            animation: slide-in 0.3s ease-out;
        }

        .animate-spin {
            animation: spin 1s linear infinite;
        }
    `]
})
export class ToastComponent {
    private toastService = inject(ToastService);

    toasts = this.toastService.toasts;

    getToastClasses(type: Toast['type']): string {
        const baseClasses = 'bg-dark-surface/95';

        switch (type) {
            case 'success':
                return `${baseClasses} border-green-500/50 text-green-400`;
            case 'error':
                return `${baseClasses} border-red-500/50 text-red-400`;
            case 'warning':
                return `${baseClasses} border-yellow-500/50 text-yellow-400`;
            case 'loading':
                return `${baseClasses} border-secondary/50 text-secondary`;
            case 'info':
            default:
                return `${baseClasses} border-secondary/50 text-secondary`;
        }
    }

    dismiss(id: string): void {
        this.toastService.dismiss(id);
    }
}
