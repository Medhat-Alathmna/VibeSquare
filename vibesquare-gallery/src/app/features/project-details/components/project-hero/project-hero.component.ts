import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../../core/models/project.model';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ClipboardService } from '../../../../core/services/clipboard.service';
import { DownloadService } from '../../../../core/services/download.service';

@Component({
  selector: 'app-project-hero',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './project-hero.component.html',
  styleUrls: ['./project-hero.component.css']
})
export class ProjectHeroComponent {
  @Input() project!: Project;

  constructor(
    private clipboardService: ClipboardService,
    private downloadService: DownloadService
  ) {}

  async copyPrompt() {
    await this.clipboardService.copyToClipboard(this.project.prompt.text);
  }

  downloadProject() {
    if (this.project.downloadUrl) {
      this.downloadService.downloadProject(
        this.project.downloadUrl,
        `${this.project.title}.zip`
      );
    }
  }

  openDemo() {
    if (this.project.demoUrl) {
      window.open(this.project.demoUrl, '_blank');
    }
  }
}
