import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Project } from '../../../../core/models/project.model';
import { ClipboardService } from '../../../../core/services/clipboard.service';
import { DownloadService } from '../../../../core/services/download.service';

@Component({
  selector: 'app-gallery-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery-modal.component.html',
  styleUrls: ['./gallery-modal.component.css']
})
export class GalleryModalComponent {
  project = signal<Project | null>(null);
  copySuccess = signal(false);
  closeModal: () => void = () => {};

  private router = inject(Router);
  private clipboardService = inject(ClipboardService);
  private downloadService = inject(DownloadService);

  navigateToDetails(event: Event): void {
    event.stopPropagation();
    const projectData = this.project();
    if (projectData) {
      this.closeModal();
      this.router.navigate(['/project', projectData.id]);
    }
  }

  async copyPrompt(event: Event): Promise<void> {
    event.stopPropagation();
    const projectData = this.project();
    if (projectData?.prompt?.text) {
      const success = await this.clipboardService.copyToClipboard(projectData.prompt.text);
      if (success) {
        this.copySuccess.set(true);
        setTimeout(() => this.copySuccess.set(false), 2000);
      }
    }
  }

  downloadProject(event: Event): void {
    event.stopPropagation();
    const projectData = this.project();
    if (projectData?.downloadUrl) {
      this.downloadService.downloadProject(projectData.downloadUrl, `${projectData.title}.zip`);
    }
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}
