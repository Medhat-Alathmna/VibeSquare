import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ProjectService } from '../../core/services/project.service';
import { AnalysisService } from '../../core/services/analysis.service';
import { QuotaService } from '../../core/services/quota.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { GalleryGridComponent } from './components/gallery-grid/gallery-grid.component';
import { LayoutSwitcherComponent, LayoutType } from './components/layout-switcher/layout-switcher.component';
import { HeroSearchComponent, SearchEvent } from './components/hero-search/hero-search.component';
import { AnalysisConfirmModalComponent, AnalysisConfirmModalData } from '../../shared/components/analysis-confirm-modal/analysis-confirm-modal.component';
import { AnalysisResultModalComponent, AnalysisResultModalData } from '../../shared/components/analysis-result-modal/analysis-result-modal.component';
import { QuotaExceededModalComponent, QuotaExceededModalData } from '../../shared/components/quota-exceeded-modal/quota-exceeded-modal.component';
import { AnalysisEstimate } from '../../core/models/analysis.model';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, GalleryGridComponent, LayoutSwitcherComponent, HeroSearchComponent],
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.css']
})
export class ExploreComponent implements OnInit {
  private projectService = inject(ProjectService);
  private analysisService = inject(AnalysisService);
  private quotaService = inject(QuotaService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private overlay = inject(Overlay);

  filteredProjects = this.projectService.filteredProjects;
  filterState = this.projectService.filterState;

  // Pagination and loading state
  pagination = this.projectService.pagination;
  isLoadingProjects = this.projectService.isLoading;
  projectsError = this.projectService.error;

  // Layout state
  currentLayout = signal<LayoutType>('grid');

  // Analysis state
  isAnalyzing = this.analysisService.state;

  ngOnInit() {
    this.projectService.loadProjects();

    // Load quota if authenticated
    if (this.authService.isAuthenticated()) {
      this.quotaService.getQuota().subscribe();
    }
  }

  onLayoutChange(layout: LayoutType) {
    this.currentLayout.set(layout);
  }

  loadMore() {
    this.projectService.loadMoreProjects().subscribe();
  }

  onHeroSearch(event: SearchEvent) {
    // Check authentication first
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/explore' }
      });
      return;
    }

    // Show loading toast
    const loadingToastId = this.toastService.loading('Estimating analysis cost...');

    // Start analysis estimation
    this.analysisService.estimateAnalysis(event.url).subscribe({
      next: (response) => {
        // Dismiss loading toast
        this.toastService.dismiss(loadingToastId);

        if (response.success) {
          this.showConfirmationModal(response.data, event.url);
        } else {
          this.toastService.error(response.message || 'Analysis estimation failed');
        }
      },
      error: (error) => {
        // Dismiss loading toast
        this.toastService.dismiss(loadingToastId);

        if (error.status === 402) {
          this.showQuotaExceededModal();
        } else {
          // Show error message for all other errors
          const message = error.error?.message || 'An error occurred. Please try again.';
          this.toastService.error(message);
        }
      }
    });
  }

  private showConfirmationModal(estimate: AnalysisEstimate,url: string): void {
    const config = new OverlayConfig({
      hasBackdrop: true,
      backdropClass: 'modal-backdrop',
      panelClass: 'modal-panel',
      positionStrategy: this.overlay.position()
        .global()
        .centerHorizontally()
        .centerVertically(),
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const overlayRef = this.overlay.create(config);
    const portal = new ComponentPortal(AnalysisConfirmModalComponent);
    const componentRef = overlayRef.attach(portal);

    // Set data
    componentRef.instance.data = {
      estimate,
      tokensRemaining: this.quotaService.tokensRemaining()
    } as AnalysisConfirmModalData;

    // Set close function
    componentRef.instance.close = (confirmed?: boolean) => {
      overlayRef.dispose();
      if (confirmed) {
        this.executeAnalysis(url);
      } else {
        this.analysisService.cancel();
      }
    };

    // Close on backdrop click
    overlayRef.backdropClick().subscribe(() => {
      overlayRef.dispose();
      this.analysisService.cancel();
    });

    // Close on escape key
    overlayRef.keydownEvents().subscribe(event => {
      if (event.key === 'Escape') {
        overlayRef.dispose();
        this.analysisService.cancel();
      }
    });
  }

  private executeAnalysis(url: string): void {
    // Show loading toast
    const loadingToastId = this.toastService.loading('Analyzing website...');

    this.analysisService.confirmAnalysis(url).subscribe({
      next: (response) => {
        // Dismiss loading toast
        this.toastService.dismiss(loadingToastId);

        if (response.success) {
          this.showResultModal(response.data);
        } else {
          this.toastService.error(response.message || 'Analysis failed');
        }
      },
      error: (error) => {
        // Dismiss loading toast
        this.toastService.dismiss(loadingToastId);

        if (error.status === 402) {
          this.showQuotaExceededModal();
        } else {
          const message = error.error?.message || 'An error occurred during analysis.';
          this.toastService.error(message);
        }
      }
    });
  }

  private showResultModal(result: any): void {
    const config = new OverlayConfig({
      hasBackdrop: true,
      backdropClass: 'modal-backdrop',
      panelClass: 'modal-panel',
      positionStrategy: this.overlay.position()
        .global()
        .centerHorizontally()
        .centerVertically(),
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const overlayRef = this.overlay.create(config);
    const portal = new ComponentPortal(AnalysisResultModalComponent);
    const componentRef = overlayRef.attach(portal);

    // Set data
    componentRef.instance.data = { result } as AnalysisResultModalData;

    // Set close function
    componentRef.instance.close = () => {
      overlayRef.dispose();
      this.analysisService.reset();
    };

    // Close on backdrop click
    overlayRef.backdropClick().subscribe(() => {
      overlayRef.dispose();
      this.analysisService.reset();
    });

    // Close on escape key
    overlayRef.keydownEvents().subscribe(event => {
      if (event.key === 'Escape') {
        overlayRef.dispose();
        this.analysisService.reset();
      }
    });
  }

  private showQuotaExceededModal(): void {
    const quota = this.quotaService.quota();

    const config = new OverlayConfig({
      hasBackdrop: true,
      backdropClass: 'modal-backdrop',
      panelClass: 'modal-panel',
      positionStrategy: this.overlay.position()
        .global()
        .centerHorizontally()
        .centerVertically(),
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const overlayRef = this.overlay.create(config);
    const portal = new ComponentPortal(QuotaExceededModalComponent);
    const componentRef = overlayRef.attach(portal);

    // Set data
    componentRef.instance.data = {
      tokensAvailable: quota?.quota.remaining ?? 0,
      resetDate: quota?.quota.periodEnd ?? new Date().toISOString(),
      upgradeAvailable: true
    } as QuotaExceededModalData;

    // Set close function
    componentRef.instance.close = (result?: 'upgrade' | 'wait') => {
      overlayRef.dispose();
      this.analysisService.reset();
    };

    // Close on backdrop click
    overlayRef.backdropClick().subscribe(() => {
      overlayRef.dispose();
      this.analysisService.reset();
    });

    // Close on escape key
    overlayRef.keydownEvents().subscribe(event => {
      if (event.key === 'Escape') {
        overlayRef.dispose();
        this.analysisService.reset();
      }
    });
  }
}
