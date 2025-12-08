import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Project } from '../../../core/models/project.model';
import { TagChipComponent } from '../tag-chip/tag-chip.component';
import { ButtonComponent } from '../button/button.component';
import { ClipboardService } from '../../../core/services/clipboard.service';
import { DownloadService } from '../../../core/services/download.service';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule, RouterModule, TagChipComponent, ButtonComponent],
  templateUrl: './project-card.component.html',
  styleUrls: ['./project-card.component.css']
})
export class ProjectCardComponent {
  @Input() project!: Project;

  isHovered = signal(false);
  imageLoaded = signal(false);

  constructor(
    private clipboardService: ClipboardService,
    private downloadService: DownloadService
  ) {}

  async copyPrompt(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    await this.clipboardService.copyToClipboard(this.project.prompt.text);
  }

  downloadProject(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.project.downloadUrl) {
      this.downloadService.downloadProject(
        this.project.downloadUrl,
        `${this.project.title}.zip`
      );
    }
  }
}
