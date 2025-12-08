import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.model';
import { ProjectHeroComponent } from './components/project-hero/project-hero.component';
import { PromptViewerComponent } from './components/prompt-viewer/prompt-viewer.component';
import { CodeTabsComponent } from './components/code-tabs/code-tabs.component';
import { MetadataPanelComponent } from './components/metadata-panel/metadata-panel.component';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ProjectHeroComponent,
    PromptViewerComponent,
    CodeTabsComponent,
    MetadataPanelComponent
  ],
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.css']
})
export class ProjectDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);

  project = signal<Project | null>(null);
  loading = signal(true);
  notFound = signal(false);

  ngOnInit() {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      this.loadProject(projectId);
    } else {
      this.notFound.set(true);
      this.loading.set(false);
    }
  }

  private loadProject(id: string) {
    const foundProject = this.projectService.getProjectById(id);
    if (foundProject) {
      this.project.set(foundProject);
      this.loading.set(false);
    } else {
      this.notFound.set(true);
      this.loading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/explore']);
  }
}
