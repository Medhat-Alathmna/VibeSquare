import { Component, input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../../core/models/project.model';
import { GalleryModalService } from '../../../../core/services/gallery-modal.service';
import { ProjectService } from '../../../../core/services/project.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { Router } from '@angular/router';

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
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private router = inject(Router);

  openModal(): void {
    this.modalService.open(this.project());
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const p = this.project();
    if (p.isFavorited) {
      this.projectService.removeFromFavorites(p.id).subscribe();
    } else {
      this.projectService.addToFavorites(p.id).subscribe();
    }
  }

  formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }
}
