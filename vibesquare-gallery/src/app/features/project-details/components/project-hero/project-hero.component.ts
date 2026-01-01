import { Component, Input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectWithBuilder } from '../../../../core/models/api-response.model';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ClipboardService } from '../../../../core/services/clipboard.service';
import { DownloadService } from '../../../../core/services/download.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { ProjectService } from '../../../../core/services/project.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-project-hero',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './project-hero.component.html',
  styleUrls: ['./project-hero.component.css']
})
export class ProjectHeroComponent implements OnInit {
  @Input() project!: ProjectWithBuilder;

  isLiking = signal(false);
  hasLiked = signal(false);

  constructor(
    private clipboardService: ClipboardService,
    private downloadService: DownloadService,
    private authService: AuthService,
    private projectService: ProjectService,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    // Initialize hasLiked from project data
    if (this.project.hasUserLiked) {
      this.hasLiked.set(true);
    }
  }

  async copyPrompt() {
    await this.clipboardService.copyToClipboard(this.project.prompt.text);
  }

  downloadSourceCode() {
    if (!this.project.sourceCodeFile) return;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    // Download source code file
    this.downloadService.downloadProject(
      this.project.sourceCodeFile,
      `${this.project.title}-source-code.zip`
    );

    // Record download
    this.projectService.recordDownload(this.project.id).subscribe();
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

  openDemo() {
    if (this.project.demoUrl) {
      window.open(this.project.demoUrl, '_blank');
    }
  }

  likeProject() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    // Prevent multiple likes
    if (this.isLiking() || this.hasLiked()) {
      if (this.hasLiked()) {
        this.toastService.info('You already liked this project');
      }
      return;
    }

    this.isLiking.set(true);
    this.projectService.recordLike(this.project.id).subscribe({
      next: (response) => {
        this.isLiking.set(false);
        this.hasLiked.set(true);
        this.project.hasUserLiked = true;
        if (response.data?.likes !== undefined) {
          this.project.likes = response.data.likes;
        }
        this.toastService.success('Thanks for the like!');
      },
      error: (err) => {
        this.isLiking.set(false);
        if (err.status === 400) {
          this.hasLiked.set(true);
          this.project.hasUserLiked = true;
          this.toastService.info('You already liked this project');
        } else {
          this.toastService.error('Failed to like project');
        }
      }
    });
  }
}
