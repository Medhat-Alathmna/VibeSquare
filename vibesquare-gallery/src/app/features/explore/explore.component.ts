import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../core/services/project.service';
import { GalleryGridComponent } from './components/gallery-grid/gallery-grid.component';
import { LayoutSwitcherComponent, LayoutType } from './components/layout-switcher/layout-switcher.component';
import { HeroSearchComponent, SearchEvent } from './components/hero-search/hero-search.component';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, GalleryGridComponent, LayoutSwitcherComponent, HeroSearchComponent],
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.css']
})
export class ExploreComponent implements OnInit {
  private projectService = inject(ProjectService);

  filteredProjects = this.projectService.filteredProjects;
  filterState = this.projectService.filterState;

  // Layout state
  currentLayout = signal<LayoutType>('grid');

  ngOnInit() {
    this.projectService.loadProjects();
  }

  onLayoutChange(layout: LayoutType) {
    this.currentLayout.set(layout);
  }

  onHeroSearch(event: SearchEvent) {
    console.log('Analyzing URL:', event.url, 'with LLM:', event.llmType);
    // TODO: Implement URL analysis logic
  }
}
