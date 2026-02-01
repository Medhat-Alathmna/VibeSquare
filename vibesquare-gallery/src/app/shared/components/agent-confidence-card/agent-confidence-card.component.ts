import { Component, computed, input, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AgentConfidence,
  ConfidenceLevel,
  getConfidenceBadgeColor,
  getConfidenceIcon,
  formatAgentName
} from '../../../core/models/prd.model';
import { ConfidenceBadgeComponent } from '../confidence-badge/confidence-badge.component';

@Component({
  selector: 'app-agent-confidence-card',
  standalone: true,
  imports: [CommonModule, ConfidenceBadgeComponent],
  template: `
    <div class="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
      <!-- Header (always visible) -->
      <button
        (click)="toggleExpanded()"
        class="w-full px-4 py-3 flex items-center justify-between hover:bg-dark-border/30 transition-colors">
        <div class="flex items-center gap-3">
          <span class="text-lg">📊</span>
          <span class="font-medium text-white">Confidence Analysis</span>
        </div>
        <div class="flex items-center gap-3">
          <app-confidence-badge
            [score]="overallScore()"
            size="sm"
            [showLabel]="false" />
          <span
            class="text-gray-400 transition-transform duration-200"
            [class.rotate-180]="expanded()">
            ▼
          </span>
        </div>
      </button>

      <!-- Expandable Content -->
      @if (expanded()) {
        <div class="px-4 pb-4 border-t border-dark-border animate-slide-down">
          <!-- Overall Score Section -->
          <div class="py-4 border-b border-dark-border/50">
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Overall Confidence</span>
              <app-confidence-badge
                [score]="overallScore()"
                size="md"
                [showLabel]="true" />
            </div>
          </div>

          <!-- Agent Breakdown -->
          <div class="py-4 space-y-3">
            <h4 class="text-sm font-medium text-gray-400 mb-3">Agent Breakdown</h4>

            @for (agent of agents(); track agent.name) {
              <div
                class="group cursor-pointer"
                (click)="onAgentClick(agent)">
                <div class="flex items-center justify-between mb-1.5">
                  <div class="flex items-center gap-2">
                    <span class="text-sm">{{ getIcon(agent.level) }}</span>
                    <span class="text-sm text-white group-hover:text-secondary transition-colors">
                      {{ getDisplayName(agent.name) }}
                    </span>
                  </div>
                  <span [class]="getScoreColorClass(agent.level)" class="text-sm font-medium">
                    {{ agent.score }}%
                  </span>
                </div>

                <!-- Progress Bar -->
                <div class="h-1.5 bg-dark-border rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500 ease-out"
                    [class]="getProgressBarColor(agent.level)"
                    [style.width.%]="agent.score">
                  </div>
                </div>

                <!-- Low confidence areas for this agent -->
                @if (agent.lowConfidenceAreas && agent.lowConfidenceAreas.length > 0) {
                  <div class="mt-2 pl-6">
                    @for (area of agent.lowConfidenceAreas; track area) {
                      <div class="flex items-center gap-1.5 text-xs text-yellow-400/80">
                        <span>⚠️</span>
                        <span>{{ area }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <!-- Global Low Confidence Areas -->
          @if (lowConfidenceAreas().length > 0) {
            <div class="pt-4 border-t border-dark-border/50">
              <h4 class="text-sm font-medium text-yellow-400 mb-2 flex items-center gap-2">
                <span>⚠️</span>
                <span>Low Confidence Areas</span>
              </h4>
              <ul class="space-y-1.5">
                @for (area of lowConfidenceAreas(); track area) {
                  <li class="text-sm text-gray-400 flex items-start gap-2">
                    <span class="text-yellow-400/60 mt-0.5">•</span>
                    <span>{{ area }}</span>
                  </li>
                }
              </ul>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    @keyframes slide-down {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-slide-down {
      animation: slide-down 0.2s ease-out;
    }
  `]
})
export class AgentConfidenceCardComponent {
  // Inputs
  agents = input.required<AgentConfidence[]>();
  overallScore = input.required<number>();
  lowConfidenceAreas = input<string[]>([]);
  initiallyExpanded = input<boolean>(false);

  // Outputs
  agentSelected = output<AgentConfidence>();

  // Local state
  expanded = signal<boolean>(false);

  constructor() {
    // Set initial expanded state after inputs are ready
    setTimeout(() => {
      this.expanded.set(this.initiallyExpanded());
    });
  }

  toggleExpanded(): void {
    this.expanded.update(v => !v);
  }

  onAgentClick(agent: AgentConfidence): void {
    this.agentSelected.emit(agent);
  }

  getIcon(level: ConfidenceLevel): string {
    return getConfidenceIcon(level);
  }

  getDisplayName(name: string): string {
    return formatAgentName(name);
  }

  getScoreColorClass(level: ConfidenceLevel): string {
    const colors: Record<ConfidenceLevel, string> = {
      high: 'text-green-400',
      medium: 'text-yellow-400',
      low: 'text-red-400'
    };
    return colors[level];
  }

  getProgressBarColor(level: ConfidenceLevel): string {
    const colors: Record<ConfidenceLevel, string> = {
      high: 'bg-green-500',
      medium: 'bg-yellow-500',
      low: 'bg-red-500'
    };
    return colors[level];
  }
}
