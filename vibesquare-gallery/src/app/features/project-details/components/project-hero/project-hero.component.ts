import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../../core/models/project.model';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ClipboardService } from '../../../../core/services/clipboard.service';
import { DownloadService } from '../../../../core/services/download.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { ProjectService } from '../../../../core/services/project.service';
import { Router } from '@angular/router';

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
    private downloadService: DownloadService,
    private authService: AuthService,
    private projectService: ProjectService,
    private router: Router
  ) { }

  async copyPrompt() {
    await this.clipboardService.copyToClipboard(this.project.prompt.text);
  }

  downloadProject() {
    if (!this.project.downloadUrl) return;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.downloadService.checkEligibility(this.project.id).subscribe({
      next: (res: any) => {
        if (res.success && res.data.canDownload) {
          this.downloadService.downloadProject(
            this.project.downloadUrl!,
            `${this.project.title}.zip`
          );
          this.downloadService.recordDownload(this.project.id).subscribe();
        } else {
          if (res.data.reason === 'not_verified') {
            if (confirm('Verify your email to download?')) {
              this.router.navigate(['/auth/verify-email']);
            }
          } else {
            alert(res.data.message || 'Download not available');
          }
        }
      },
      error: (err: any) => {
        alert(err.error?.message || 'Failed to check download eligibility');
      }
    });
  }

  toggleFavorite() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    if (this.project.isFavorited) {
      this.projectService.removeFromFavorites(this.project.id).subscribe();
    } else {
      this.projectService.addToFavorites(this.project.id).subscribe();
    }
  }

  openDemo() {
    if (this.project.demoUrl) {
      window.open(this.project.demoUrl, '_blank');
    }
  }
}
