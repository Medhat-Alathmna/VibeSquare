import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tag-chip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      [class]="chipClasses"
      (click)="onChipClick()">
      {{ label }}
      <button
        *ngIf="removable"
        (click)="onRemove($event)"
        class="ml-1.5 hover:text-secondary">
        ×
      </button>
    </span>
  `
})
export class TagChipComponent {
  @Input() label: string = '';
  @Input() removable = false;
  @Input() selected = false;
  @Input() clickable = false;
  @Output() removed = new EventEmitter<void>();
  @Output() clicked = new EventEmitter<void>();

  get chipClasses(): string {
    const base = 'inline-flex items-center px-3 py-1 text-sm rounded-full transition-all duration-200';
    const interactive = this.clickable ? 'cursor-pointer hover:bg-secondary/20' : '';
    const state = this.selected
      ? 'bg-secondary text-black'
      : 'bg-dark-surface text-white border border-dark-border';

    return `${base} ${interactive} ${state}`;
  }

  onChipClick() {
    if (this.clickable) {
      this.clicked.emit();
    }
  }

  onRemove(event: Event) {
    event.stopPropagation();
    this.removed.emit();
  }
}
