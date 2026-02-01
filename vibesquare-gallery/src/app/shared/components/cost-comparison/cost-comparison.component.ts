import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { calculateCostRatio } from '../../../core/models/prd.model';

@Component({
    selector: 'app-cost-comparison',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="bg-dark-bg rounded-xl border border-dark-border overflow-hidden">
            <!-- Current Model -->
            <div class="p-4 border-b border-dark-border/50">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-gray-400">Current Model</span>
                    <span class="text-xs px-2 py-0.5 bg-dark-surface rounded text-gray-500">Active</span>
                </div>
                <div class="flex items-baseline justify-between">
                    <span class="text-white font-medium">{{ currentModel() }}</span>
                    <div class="text-right">
                        <span class="text-green-400 font-semibold">{{ formattedCurrentCost() }}</span>
                        <span class="text-xs text-gray-500 ml-1">per M tokens</span>
                    </div>
                </div>
            </div>

            <!-- Arrow Indicator -->
            <div class="flex items-center justify-center py-2 bg-dark-border/20">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-px bg-dark-border"></div>
                    <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <div class="w-8 h-px bg-dark-border"></div>
                </div>
            </div>

            <!-- Proposed Model -->
            <div class="p-4">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-gray-400">Proposed Model</span>
                    <span class="text-xs px-2 py-0.5 bg-yellow-500/20 rounded text-yellow-400">Upgrade</span>
                </div>
                <div class="flex items-baseline justify-between">
                    <span class="text-white font-medium">{{ proposedModel() }}</span>
                    <div class="text-right">
                        <span class="text-yellow-400 font-semibold">{{ formattedProposedCost() }}</span>
                        <span class="text-xs text-gray-500 ml-1">per M tokens</span>
                    </div>
                </div>

                <!-- Cost Difference -->
                <div class="mt-3 pt-3 border-t border-dark-border/50">
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-400">Cost Difference</span>
                        <span class="text-sm font-medium" [class]="costDifferenceColorClass()">
                            {{ costRatio() }}x more expensive
                        </span>
                    </div>

                    <!-- Visual Bar -->
                    <div class="mt-2 relative h-2 bg-dark-border rounded-full overflow-hidden">
                        <!-- Current cost bar -->
                        <div
                            class="absolute left-0 top-0 h-full bg-green-500/50 rounded-full"
                            [style.width.%]="currentCostPercentage()">
                        </div>
                        <!-- Proposed cost bar (extends beyond) -->
                        <div
                            class="absolute left-0 top-0 h-full bg-yellow-500/50 rounded-full transition-all duration-500"
                            [style.width.%]="100">
                        </div>
                    </div>
                    <div class="mt-1 flex justify-between text-xs text-gray-500">
                        <span>{{ formattedCurrentCost() }}</span>
                        <span>{{ formattedProposedCost() }}</span>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }
    `]
})
export class CostComparisonComponent {
    currentModel = input.required<string>();
    proposedModel = input.required<string>();
    currentCost = input.required<number>();
    proposedCost = input.required<number>();

    costRatio = computed(() =>
        calculateCostRatio(this.currentCost(), this.proposedCost())
    );

    formattedCurrentCost = computed(() =>
        this.formatCost(this.currentCost())
    );

    formattedProposedCost = computed(() =>
        this.formatCost(this.proposedCost())
    );

    currentCostPercentage = computed(() => {
        const ratio = this.costRatio();
        if (ratio === 0 || !isFinite(ratio)) return 100;
        return Math.min(100, (1 / ratio) * 100);
    });

    costDifferenceColorClass = computed(() => {
        const ratio = this.costRatio();
        if (ratio >= 20) return 'text-red-400';
        if (ratio >= 10) return 'text-orange-400';
        return 'text-yellow-400';
    });

    private formatCost(cost: number): string {
        if (cost >= 1) {
            return `$${cost.toFixed(2)}`;
        }
        return `$${cost.toFixed(3)}`;
    }
}
