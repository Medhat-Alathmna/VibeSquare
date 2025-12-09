import { Component, input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../../core/models/project.model';
import { GalleryModalService } from '../../../../core/services/gallery-modal.service';

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

  private modalService = inject(GalleryModalService);

  openModal(): void {
    this.modalService.open(this.project());
  }

  formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }
}
