import { Component, input, signal, computed, effect, ElementRef, viewChildren, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../../core/models/project.model';
import { GalleryCardComponent } from '../gallery-card/gallery-card.component';
import { LayoutType } from '../layout-switcher/layout-switcher.component';

@Component({
  selector: 'app-gallery-grid',
  standalone: true,
  imports: [CommonModule, GalleryCardComponent],
  templateUrl: './gallery-grid.component.html',
  styleUrls: ['./gallery-grid.component.css']
})
export class GalleryGridComponent {
  // Signal-based inputs
  projects = input.required<Project[]>();
  layout = input<LayoutType>('grid');

  // Carousel state
  currentSlide = signal(0);
  isAnimating = signal(false);

  // Computed values
  totalSlides = computed(() => this.projects().length);
  canGoPrev = computed(() => this.currentSlide() > 0);
  canGoNext = computed(() => this.currentSlide() < this.totalSlides() - 1);

  // Visible slides for carousel (show 3 at a time on desktop)
  visibleProjects = computed(() => {
    if (this.layout() !== 'carousel') {
      return this.projects();
    }
    return this.projects();
  });

  constructor() {
    // Reset slide when layout changes
    effect(() => {
      if (this.layout()) {
        this.currentSlide.set(0);
      }
    });
  }

  trackByProjectId(index: number, project: Project): string {
    return project.id;
  }

  // Carousel navigation
  nextSlide() {
    if (this.canGoNext() && !this.isAnimating()) {
      this.isAnimating.set(true);
      this.currentSlide.update(v => v + 1);
      setTimeout(() => this.isAnimating.set(false), 500);
    }
  }

  prevSlide() {
    if (this.canGoPrev() && !this.isAnimating()) {
      this.isAnimating.set(true);
      this.currentSlide.update(v => v - 1);
      setTimeout(() => this.isAnimating.set(false), 500);
    }
  }

  goToSlide(index: number) {
    if (index !== this.currentSlide() && !this.isAnimating()) {
      this.isAnimating.set(true);
      this.currentSlide.set(index);
      setTimeout(() => this.isAnimating.set(false), 500);
    }
  }

  // Calculate carousel transform
  getCarouselTransform(): string {
    const slideWidth = 100 / 3; // 3 slides visible
    return `translateX(-${this.currentSlide() * slideWidth}%)`;
  }
}
