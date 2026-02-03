import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ConfidenceData,
    AgentConfidence,
    getConfidenceIcon,
    getConfidenceLabel,
    formatAgentName
} from '../../../core/models/prd.model';
import { ConfidenceBadgeComponent } from '../confidence-badge/confidence-badge.component';
import { AgentConfidenceCardComponent } from '../agent-confidence-card/agent-confidence-card.component';

@Component({
    selector: 'app-confidence-analysis-section',
    standalone: true,
    imports: [CommonModule, ConfidenceBadgeComponent],
    template: `
        <div class="bg-dark-surface border border-dark-border rounded-xl p-5">
            <!-- Header -->
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                    <span class="text-lg">🎯</span>
                    <h3 class="text-lg font-display font-bold text-white">Confidence Analysis</h3>
                </div>
                @if (confidence()) {
                    <app-confidence-badge
                        [score]="confidence()!.overallScore"
                        size="md"
                        [showLabel]="true" />
                }
            </div>

            @if (confidence(); as conf) {
                <!-- Status Message -->
                <div class="mb-4 p-3 rounded-lg"
                    [class]="getStatusBgClass(conf.overallLevel)">
                    <div class="flex items-center gap-2">
                        <span>{{ getConfidenceIcon(conf.overallLevel) }}</span>
                        <span [class]="getStatusTextClass(conf.overallLevel)">
                            {{ getStatusMessage(conf.overallScore) }}
                        </span>
                    </div>
                </div>

                <!-- Agent Scores Grid -->
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    @for (agent of conf.agentConfidences; track agent.name) {
                        <div class="p-3 bg-dark-bg rounded-lg border border-dark-border/50">
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-xs text-gray-400">{{ formatAgentName(agent.name) }}</span>
                                <span class="text-sm">{{ getConfidenceIcon(agent.level) }}</span>
                            </div>
                            <div class="text-lg font-bold" [class]="getScoreColorClass(agent.level)">
                                {{ agent.score }}%
                            </div>
                        </div>
                    }
                </div>

                <!-- Low Confidence Areas -->
                @if (conf.lowConfidenceAreas && conf.lowConfidenceAreas.length > 0) {
                    <div class="pt-4 border-t border-dark-border/50">
                        <h4 class="text-sm font-medium text-yellow-400 mb-2 flex items-center gap-2">
                            <span>⚠️</span>
                            <span>Areas Needing Attention</span>
                        </h4>
                        <ul class="space-y-1.5">
                            @for (area of conf.lowConfidenceAreas; track area) {
                                <li class="text-sm text-gray-400 flex items-start gap-2">
                                    <span class="text-yellow-400/60 mt-0.5">•</span>
                                    <span>{{ area }}</span>
                                </li>
                            }
                        </ul>
                    </div>
                }
            } @else {
                <!-- No Data State -->
                <div class="text-center py-8 text-gray-500">
                    <span class="text-2xl mb-2 block">📊</span>
                    <p>Confidence data not available</p>
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
export class ConfidenceAnalysisSectionComponent {
    confidence = input<ConfidenceData | null>(null);

    getConfidenceIcon = getConfidenceIcon;
    getConfidenceLabel = getConfidenceLabel;
    formatAgentName = formatAgentName;

    getStatusBgClass(level: string): string {
        const classes: Record<string, string> = {
            high: 'bg-green-500/10 border border-green-500/20',
            medium: 'bg-yellow-500/10 border border-yellow-500/20',
            low: 'bg-red-500/10 border border-red-500/20'
        };
        return classes[level] || classes['medium'];
    }

    getStatusTextClass(level: string): string {
        const classes: Record<string, string> = {
            high: 'text-green-400',
            medium: 'text-yellow-400',
            low: 'text-red-400'
        };
        return classes[level] || classes['medium'];
    }

    getScoreColorClass(level: string): string {
        const classes: Record<string, string> = {
            high: 'text-green-400',
            medium: 'text-yellow-400',
            low: 'text-red-400'
        };
        return classes[level] || 'text-white';
    }

    getStatusMessage(score: number): string {
        if (score >= 80) {
            return 'Analysis Complete - Confidence level is acceptable for implementation.';
        } else if (score >= 70) {
            return 'Analysis Complete - Some areas may benefit from additional review.';
        } else {
            return 'Analysis Complete - Consider reviewing low confidence areas before implementation.';
        }
    }
}
