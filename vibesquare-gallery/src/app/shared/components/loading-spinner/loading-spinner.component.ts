import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center" [class.h-screen]="fullScreen">
      <div class="relative">
        <div
          [class]="spinnerClasses"
          class="border-4 border-dark-border border-t-secondary rounded-full animate-spin">
        </div>
        <span *ngIf="message" class="block text-center mt-4 text-gray-400">
          {{ message }}
        </span>
      </div>
    </div>
  `
})
export class LoadingSpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() message?: string;
  @Input() fullScreen = false;

  get spinnerClasses(): string {
    const sizes = {
      sm: 'w-6 h-6',
      md: 'w-12 h-12',
      lg: 'w-16 h-16'
    };
    return sizes[this.size];
  }
}
