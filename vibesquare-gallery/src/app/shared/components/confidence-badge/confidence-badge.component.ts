import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ConfidenceLevel,
  getConfidenceLevel,
  getConfidenceBadgeColor,
  getConfidenceIcon,
  getConfidenceLabel
} from '../../../core/models/prd.model';

type BadgeSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-confidence-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [class]="badgeClasses()"
      [title]="tooltipText()"
      class="inline-flex items-center gap-1.5 rounded-full border font-medium transition-all duration-300"
      [class.animate-pulse]="animating()">

      <!-- Icon -->
      <span [class]="iconSizeClass()">{{ icon() }}</span>

      <!-- Score -->
      <span [class]="scoreSizeClass()">{{ score() }}%</span>

      <!-- Label (optional) -->
      @if (showLabel()) {
        <span [class]="labelSizeClass()">{{ label() }}</span>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    @keyframes score-update {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    .score-updated {
      animation: score-update 0.3s ease-out;
    }
  `]
})
export class ConfidenceBadgeComponent {
  // Inputs using Angular 17+ signal-based inputs
  score = input.required<number>();
  size = input<BadgeSize>('md');
  showLabel = input<boolean>(true);
  animating = input<boolean>(false);

  // Computed values
  level = computed<ConfidenceLevel>(() => getConfidenceLevel(this.score()));
  icon = computed(() => getConfidenceIcon(this.level()));
  label = computed(() => getConfidenceLabel(this.level()));
  colorClasses = computed(() => getConfidenceBadgeColor(this.level()));

  tooltipText = computed(() => {
    const score = this.score();
    if (score >= 80) {
      return 'High confidence (≥80%): Analysis is reliable';
    } else if (score >= 70) {
      return 'Medium confidence (70-79%): Some areas may need clarification';
    } else {
      return 'Low confidence (<70%): Consider providing additional context';
    }
  });

  badgeClasses = computed(() => {
    const sizeClasses: Record<BadgeSize, string> = {
      sm: 'px-2 py-0.5',
      md: 'px-3 py-1',
      lg: 'px-4 py-1.5'
    };
    return `${this.colorClasses()} ${sizeClasses[this.size()]}`;
  });

  iconSizeClass = computed(() => {
    const sizes: Record<BadgeSize, string> = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base'
    };
    return sizes[this.size()];
  });

  scoreSizeClass = computed(() => {
    const sizes: Record<BadgeSize, string> = {
      sm: 'text-xs font-semibold',
      md: 'text-sm font-semibold',
      lg: 'text-base font-bold'
    };
    return sizes[this.size()];
  });

  labelSizeClass = computed(() => {
    const sizes: Record<BadgeSize, string> = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base'
    };
    return sizes[this.size()];
  });
}
