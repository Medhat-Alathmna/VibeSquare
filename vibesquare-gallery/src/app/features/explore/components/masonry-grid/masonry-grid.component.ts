import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../../core/models/project.model';
import { ProjectCardComponent } from '../../../../shared/components/project-card/project-card.component';

@Component({
  selector: 'app-masonry-grid',
  standalone: true,
  imports: [CommonModule, ProjectCardComponent],
  templateUrl: './masonry-grid.component.html',
  styleUrls: ['./masonry-grid.component.css']
})
export class MasonryGridComponent {
  @Input() projects: Project[] = [];

  trackByProjectId(index: number, project: Project): string {
    return project.id;
  }
}
