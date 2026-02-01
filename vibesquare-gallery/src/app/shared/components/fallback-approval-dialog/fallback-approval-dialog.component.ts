import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FallbackRequest,
    formatAgentName,
    calculateCostRatio
} from '../../../core/models/prd.model';
import { CostComparisonComponent } from '../cost-comparison/cost-comparison.component';

export interface FallbackApprovalResult {
    approved: boolean;
    targetModel?: string;
}

@Component({
    selector: 'app-fallback-approval-dialog',
    standalone: true,
    imports: [CommonModule, CostComparisonComponent],
    template: `
        <div class="modal-content max-w-lg">
            <!-- Header -->
            <div class="modal-header">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <span class="text-xl">⚠️</span>
                    </div>
                    <div>
                        <h3 class="text-lg font-display font-bold text-white">Model Upgrade Required</h3>
                        <p class="text-sm text-gray-400">{{ agentDisplayName }}</p>
                    </div>
                </div>
            </div>

            <!-- Body -->
            <div class="modal-body">
                <!-- Failure Reason -->
                <div class="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div class="flex items-start gap-3">
                        <span class="text-red-400 mt-0.5">❌</span>
                        <div>
                            <p class="text-sm font-medium text-red-400 mb-1">Analysis Failed</p>
                            <p class="text-sm text-red-300/80">{{ data.failureReason }}</p>
                        </div>
                    </div>
                </div>

                <!-- Cost Comparison -->
                <app-cost-comparison
                    [currentModel]="data.currentModel"
                    [proposedModel]="data.proposedModel"
                    [currentCost]="data.estimatedCost.current"
                    [proposedCost]="data.estimatedCost.proposed" />

                <!-- Model Info -->
                <div class="mt-5 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div class="flex items-start gap-3">
                        <span class="text-blue-400 mt-0.5">ℹ️</span>
                        <div>
                            <p class="text-sm text-blue-300/80">
                                <span class="font-medium text-blue-400">{{ data.proposedModel }}</span>
                                has higher reasoning capability and may produce better results for complex analyses.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="modal-footer">
                <div class="flex flex-col gap-3 w-full">
                    <!-- Decline Button -->
                    <button
                        (click)="onDecline()"
                        class="w-full px-4 py-2.5 text-sm font-medium text-gray-400 border border-dark-border rounded-lg hover:bg-dark-border/50 hover:text-white transition-colors">
                        Decline - Continue with lower quality
                    </button>

                    <!-- Approve Button -->
                    <button
                        (click)="onApprove()"
                        class="w-full px-4 py-2.5 text-sm font-medium bg-secondary text-black rounded-lg hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2">
                        <span>Approve - Use {{ data.proposedModel }}</span>
                        <span class="text-xs opacity-75">({{ costRatio }}x cost)</span>
                    </button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }

        .modal-content {
            @apply bg-dark-surface border border-dark-border rounded-2xl overflow-hidden;
        }

        .modal-header {
            @apply p-5 border-b border-dark-border;
        }

        .modal-body {
            @apply p-5;
        }

        .modal-footer {
            @apply p-5 border-t border-dark-border;
        }
    `]
})
export class FallbackApprovalDialogComponent {
    // Set by modal opener
    data!: FallbackRequest;
    close!: (result: FallbackApprovalResult) => void;

    get agentDisplayName(): string {
        return formatAgentName(this.data.agentName);
    }

    get costRatio(): number {
        return calculateCostRatio(this.data.estimatedCost.current, this.data.estimatedCost.proposed);
    }

    onApprove(): void {
        this.close({
            approved: true,
            targetModel: this.data.proposedModel
        });
    }

    onDecline(): void {
        this.close({
            approved: false
        });
    }
}
