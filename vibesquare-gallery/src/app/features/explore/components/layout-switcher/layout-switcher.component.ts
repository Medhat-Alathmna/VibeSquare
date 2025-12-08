import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type LayoutType = 'grid' | 'masonry' | 'carousel';

export interface LayoutOption {
  value: LayoutType;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-layout-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './layout-switcher.component.html',
  styleUrls: ['./layout-switcher.component.css']
})
export class LayoutSwitcherComponent {
  // Output signal for layout change
  layoutChange = output<LayoutType>();

  // Local state
  isOpen = signal(false);
  selectedLayout = signal<LayoutType>('grid');

  layouts: LayoutOption[] = [
    {
      value: 'grid',
      label: 'Grid',
      icon: 'grid'
    },
    {
      value: 'masonry',
      label: 'Masonry',
      icon: 'masonry'
    },
    {
      value: 'carousel',
      label: 'Carousel',
      icon: 'carousel'
    }
  ];

  get currentLayout(): LayoutOption {
    return this.layouts.find(l => l.value === this.selectedLayout()) || this.layouts[0];
  }

  toggleDropdown() {
    this.isOpen.update(v => !v);
  }

  selectLayout(layout: LayoutType) {
    this.selectedLayout.set(layout);
    this.layoutChange.emit(layout);
    this.isOpen.set(false);
  }

  closeDropdown() {
    this.isOpen.set(false);
  }
}
