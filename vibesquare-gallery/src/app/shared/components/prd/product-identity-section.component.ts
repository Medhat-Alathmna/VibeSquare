import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ProductVision {
    statement: string;
    futureState: string;
    timeframe: string;
}

export interface ProblemStatement {
    coreProblem: string;
    affectedSegments: Array<{
        name: string;
        painLevel: number; // 1-10
    }>;
}

export interface ProductIdentity {
    vision: ProductVision;
    problem: ProblemStatement;
}

@Component({
    selector: 'app-product-identity-section',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="space-y-4">
            <!-- Product Vision -->
            @if (identity()?.vision; as vision) {
                <div class="bg-dark-surface border border-dark-border rounded-xl p-5">
                    <div class="flex items-center gap-2 mb-4">
                        <span class="text-lg">🎯</span>
                        <h3 class="text-lg font-display font-bold text-white">Product Vision</h3>
                    </div>

                    <div class="space-y-4">
                        <!-- Vision Statement -->
                        <div>
                            <h4 class="text-sm font-medium text-gray-400 mb-2">Statement</h4>
                            <p class="text-white bg-dark-bg p-3 rounded-lg border-l-2 border-secondary italic">
                                "{{ vision.statement }}"
                            </p>
                        </div>

                        <!-- Future State -->
                        <div>
                            <h4 class="text-sm font-medium text-gray-400 mb-2">Future State</h4>
                            <p class="text-gray-300">{{ vision.futureState }}</p>
                        </div>

                        <!-- Timeframe -->
                        <div class="flex items-center gap-2">
                            <span class="text-gray-400 text-sm">Timeframe:</span>
                            <span class="px-2 py-0.5 bg-secondary/20 text-secondary rounded text-sm font-medium">
                                {{ vision.timeframe }}
                            </span>
                        </div>
                    </div>
                </div>
            }

            <!-- Problem Statement -->
            @if (identity()?.problem; as problem) {
                <div class="bg-dark-surface border border-dark-border rounded-xl p-5">
                    <div class="flex items-center gap-2 mb-4">
                        <span class="text-lg">🔍</span>
                        <h3 class="text-lg font-display font-bold text-white">Problem Statement</h3>
                    </div>

                    <div class="space-y-4">
                        <!-- Core Problem -->
                        <div>
                            <h4 class="text-sm font-medium text-gray-400 mb-2">Core Problem</h4>
                            <p class="text-gray-300">{{ problem.coreProblem }}</p>
                        </div>

                        <!-- Affected Segments -->
                        @if (problem.affectedSegments && problem.affectedSegments.length > 0) {
                            <div>
                                <h4 class="text-sm font-medium text-gray-400 mb-3">Affected Segments</h4>
                                <div class="space-y-2">
                                    @for (segment of problem.affectedSegments; track segment.name) {
                                        <div class="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
                                            <span class="text-white">{{ segment.name }}</span>
                                            <div class="flex items-center gap-2">
                                                <span class="text-sm text-gray-400">Pain Level:</span>
                                                <div class="flex items-center gap-1">
                                                    @for (i of getPainDots(segment.painLevel); track i) {
                                                        <div
                                                            class="w-2 h-2 rounded-full"
                                                            [class]="getPainDotClass(i, segment.painLevel)">
                                                        </div>
                                                    }
                                                </div>
                                                <span class="text-sm font-medium" [class]="getPainTextClass(segment.painLevel)">
                                                    {{ segment.painLevel }}/10
                                                </span>
                                            </div>
                                        </div>
                                    }
                                </div>
                            </div>
                        }
                    </div>
                </div>
            }
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }
    `]
})
export class ProductIdentitySectionComponent {
    identity = input<ProductIdentity | null>(null);

    getPainDots(max: number): number[] {
        return Array.from({ length: 10 }, (_, i) => i + 1);
    }

    getPainDotClass(index: number, painLevel: number): string {
        if (index <= painLevel) {
            if (painLevel >= 8) return 'bg-red-400';
            if (painLevel >= 5) return 'bg-yellow-400';
            return 'bg-green-400';
        }
        return 'bg-dark-border';
    }

    getPainTextClass(painLevel: number): string {
        if (painLevel >= 8) return 'text-red-400';
        if (painLevel >= 5) return 'text-yellow-400';
        return 'text-green-400';
    }
}
