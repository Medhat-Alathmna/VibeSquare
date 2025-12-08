import { Component, input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Project } from '../../../../core/models/project.model';
import { ClipboardService } from '../../../../core/services/clipboard.service';
import { DownloadService } from '../../../../core/services/download.service';

@Component({
  selector: 'app-gallery-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery-card.component.html',
  styleUrls: ['./gallery-card.component.css']
})
export class GalleryCardComponent {
  project = input.required<Project>();

  imageLoaded = signal(false);
  isModalOpen = signal(false);
  copySuccess = signal(false);

  private router = inject(Router);
  private clipboardService = inject(ClipboardService);
  private downloadService = inject(DownloadService);

  openModal() {
    this.isModalOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.isModalOpen.set(false);
    document.body.style.overflow = '';
  }

  navigateToDetails(event: Event) {
    event.stopPropagation();
    this.closeModal();
    this.router.navigate(['/project', this.project().id]);
  }

  async copyPrompt(event: Event) {
    event.stopPropagation();
    const success = await this.clipboardService.copyToClipboard(this.project().prompt.text);
    if (success) {
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    }
  }

  downloadProject(event: Event) {
    event.stopPropagation();
    const proj = this.project();
    if (proj.downloadUrl) {
      this.downloadService.downloadProject(proj.downloadUrl, `${proj.title}.zip`);
    }
  }

  formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }
}
