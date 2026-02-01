import { Component, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    RoadmapData,
    RoadmapMilestone,
    RoadmapItem,
    RoadmapPhase,
    getPhaseDisplayName,
    getPhaseColorClass,
    getPriorityBadgeClass
} from '../../../../core/models/prd.model';

@Component({
    selector: 'app-roadmap-timeline',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="bg-dark-surface border border-dark-border rounded-xl p-5">
            <!-- Header -->
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                    <span class="text-lg">🗺️</span>
                    <h3 class="text-lg font-display font-bold text-white">Product Roadmap</h3>
                </div>
                @if (roadmap(); as data) {
                    <div class="flex items-center gap-2 text-sm">
                        <span class="text-gray-400">{{ data.completedStories }}/{{ data.totalStories }}</span>
                        <span class="text-gray-500">stories</span>
                    </div>
                }
            </div>

            @if (roadmap(); as data) {
                <!-- Overall Progress -->
                <div class="mb-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-gray-400">Overall Progress</span>
                        <span class="text-sm font-medium text-secondary">{{ overallProgress() }}%</span>
                    </div>
                    <div class="h-2 bg-dark-bg rounded-full overflow-hidden">
                        <div
                            class="h-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-full transition-all duration-500"
                            [style.width.%]="overallProgress()">
                        </div>
                    </div>
                </div>

                <!-- Timeline -->
                <div class="relative">
                    <!-- Vertical line -->
                    <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-dark-border"></div>

                    <!-- Milestones -->
                    <div class="space-y-4">
                        @for (milestone of data.milestones; track milestone.phase) {
                            <div class="relative pl-10">
                                <!-- Timeline dot -->
                                <div
                                    class="absolute left-2 w-5 h-5 rounded-full border-2 border-dark-surface flex items-center justify-center"
                                    [class]="getMilestoneClass(milestone)">
                                    @if (getMilestoneProgress(milestone) === 100) {
                                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                                        </svg>
                                    }
                                </div>

                                <!-- Milestone Card -->
                                <div
                                    class="bg-dark-bg border border-dark-border/50 rounded-lg p-4 hover:border-dark-border transition-colors cursor-pointer"
                                    (click)="toggleMilestone(milestone.phase)">

                                    <!-- Milestone Header -->
                                    <div class="flex items-center justify-between mb-2">
                                        <div class="flex items-center gap-2">
                                            <span
                                                class="px-2 py-0.5 rounded text-xs font-medium"
                                                [class]="getPhaseBadgeClass(milestone.phase)">
                                                {{ getPhaseDisplayName(milestone.phase) }}
                                            </span>
                                            <span class="text-white font-medium">{{ milestone.name }}</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs text-gray-500">
                                                {{ milestone.completedCount }}/{{ milestone.totalCount }}
                                            </span>
                                            <svg
                                                class="w-4 h-4 text-gray-400 transition-transform"
                                                [class.rotate-180]="isExpanded(milestone.phase)"
                                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>

                                    <!-- Progress Bar -->
                                    <div class="h-1.5 bg-dark-border rounded-full overflow-hidden mb-2">
                                        <div
                                            class="h-full rounded-full transition-all duration-300"
                                            [class]="getPhaseProgressClass(milestone.phase)"
                                            [style.width.%]="getMilestoneProgress(milestone)">
                                        </div>
                                    </div>

                                    @if (milestone.description) {
                                        <p class="text-xs text-gray-500">{{ milestone.description }}</p>
                                    }

                                    <!-- Expanded Items -->
                                    @if (isExpanded(milestone.phase) && milestone.items.length > 0) {
                                        <div class="mt-4 pt-3 border-t border-dark-border/50 space-y-2">
                                            @for (item of milestone.items; track item.id) {
                                                <div class="flex items-start gap-3 p-2 rounded hover:bg-dark-surface/50">
                                                    <!-- Status Icon -->
                                                    <div class="mt-0.5">
                                                        @switch (item.status) {
                                                            @case ('completed') {
                                                                <div class="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                                                    <svg class="w-2.5 h-2.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </div>
                                                            }
                                                            @case ('in_progress') {
                                                                <div class="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                                    <div class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                                                                </div>
                                                            }
                                                            @default {
                                                                <div class="w-4 h-4 rounded-full bg-dark-border flex items-center justify-center">
                                                                    <div class="w-2 h-2 rounded-full bg-gray-500"></div>
                                                                </div>
                                                            }
                                                        }
                                                    </div>

                                                    <!-- Item Content -->
                                                    <div class="flex-1 min-w-0">
                                                        <div class="flex items-center gap-2">
                                                            <span
                                                                class="text-sm"
                                                                [class.text-white]="item.status !== 'completed'"
                                                                [class.text-gray-400]="item.status === 'completed'"
                                                                [class.line-through]="item.status === 'completed'">
                                                                {{ item.title }}
                                                            </span>
                                                            <span
                                                                class="px-1.5 py-0.5 rounded text-xs"
                                                                [class]="getPriorityBadgeClass(item.priority)">
                                                                {{ item.priority }}
                                                            </span>
                                                        </div>
                                                        @if (item.description) {
                                                            <p class="text-xs text-gray-500 mt-0.5 truncate">{{ item.description }}</p>
                                                        }
                                                    </div>

                                                    <!-- Story Points -->
                                                    @if (item.storyPoints) {
                                                        <span class="text-xs text-gray-500 bg-dark-border/50 px-1.5 py-0.5 rounded">
                                                            {{ item.storyPoints }} SP
                                                        </span>
                                                    }
                                                </div>
                                            }
                                        </div>
                                    }
                                </div>
                            </div>
                        }
                    </div>
                </div>

                <!-- Target Date Legend -->
                @if (hasTargetDates()) {
                    <div class="mt-6 pt-4 border-t border-dark-border/50">
                        <h4 class="text-xs font-medium text-gray-400 mb-2">Target Dates</h4>
                        <div class="flex flex-wrap gap-3">
                            @for (milestone of data.milestones; track milestone.phase) {
                                @if (milestone.targetDate) {
                                    <div class="flex items-center gap-2 text-xs">
                                        <span
                                            class="w-2 h-2 rounded-full"
                                            [class]="getPhaseColorClass(milestone.phase)">
                                        </span>
                                        <span class="text-gray-400">{{ getPhaseDisplayName(milestone.phase) }}:</span>
                                        <span class="text-white">{{ milestone.targetDate }}</span>
                                    </div>
                                }
                            }
                        </div>
                    </div>
                }
            } @else {
                <!-- No Data State -->
                <div class="text-center py-8 text-gray-500">
                    <span class="text-2xl mb-2 block">🗺️</span>
                    <p>Roadmap data not available</p>
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
export class RoadmapTimelineComponent {
    roadmap = input<RoadmapData | null>(null);

    expandedMilestones = signal<Record<RoadmapPhase, boolean>>({
        mvp: true,
        v2: false,
        v3: false,
        future: false
    });

    overallProgress = computed(() => {
        const data = this.roadmap();
        if (!data || data.totalStories === 0) return 0;
        return Math.round((data.completedStories / data.totalStories) * 100);
    });

    toggleMilestone(phase: RoadmapPhase): void {
        this.expandedMilestones.update(state => ({
            ...state,
            [phase]: !state[phase]
        }));
    }

    isExpanded(phase: RoadmapPhase): boolean {
        return this.expandedMilestones()[phase] || false;
    }

    getMilestoneProgress(milestone: RoadmapMilestone): number {
        if (milestone.totalCount === 0) return 0;
        return Math.round((milestone.completedCount / milestone.totalCount) * 100);
    }

    getMilestoneClass(milestone: RoadmapMilestone): string {
        const progress = this.getMilestoneProgress(milestone);
        if (progress === 100) return getPhaseColorClass(milestone.phase);
        if (progress > 0) return 'bg-dark-bg border-2 ' + getPhaseColorClass(milestone.phase).replace('bg-', 'border-');
        return 'bg-dark-bg border-dark-border';
    }

    getPhaseBadgeClass(phase: RoadmapPhase): string {
        const classes: Record<RoadmapPhase, string> = {
            mvp: 'bg-green-500/20 text-green-400',
            v2: 'bg-blue-500/20 text-blue-400',
            v3: 'bg-purple-500/20 text-purple-400',
            future: 'bg-gray-500/20 text-gray-400'
        };
        return classes[phase];
    }

    getPhaseProgressClass(phase: RoadmapPhase): string {
        const classes: Record<RoadmapPhase, string> = {
            mvp: 'bg-green-500',
            v2: 'bg-blue-500',
            v3: 'bg-purple-500',
            future: 'bg-gray-500'
        };
        return classes[phase];
    }

    hasTargetDates(): boolean {
        const data = this.roadmap();
        if (!data) return false;
        return data.milestones.some(m => !!m.targetDate);
    }

    // Re-export helper functions for template use
    getPhaseDisplayName = getPhaseDisplayName;
    getPhaseColorClass = getPhaseColorClass;
    getPriorityBadgeClass = getPriorityBadgeClass;
}
