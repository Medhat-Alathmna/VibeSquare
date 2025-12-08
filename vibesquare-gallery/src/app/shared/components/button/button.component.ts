import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [class]="buttonClasses"
      [disabled]="disabled"
      [type]="type">
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' = 'button';
  @Input() fullWidth = false;

  get buttonClasses(): string {
    const base = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-secondary text-black hover:bg-secondary/90',
      secondary: 'bg-dark-surface text-white hover:bg-dark-border',
      outline: 'border-2 border-secondary text-secondary hover:bg-secondary/10',
      ghost: 'text-white hover:bg-dark-surface'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    const width = this.fullWidth ? 'w-full' : '';

    return `${base} ${variants[this.variant]} ${sizes[this.size]} ${width}`;
  }
}
