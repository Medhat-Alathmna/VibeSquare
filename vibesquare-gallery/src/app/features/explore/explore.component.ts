import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ProjectService } from '../../core/services/project.service';
import { PrdService } from '../../core/services/prd.service';
import { AnalysisService } from '../../core/services/analysis.service';
import { QuotaService } from '../../core/services/quota.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { GalleryGridComponent } from './components/gallery-grid/gallery-grid.component';
import { LayoutSwitcherComponent, LayoutType } from './components/layout-switcher/layout-switcher.component';
import { HeroSearchComponent, SearchEvent } from './components/hero-search/hero-search.component';
import { AnalysisConfirmModalComponent, AnalysisConfirmModalData } from '../../shared/components/analysis-confirm-modal/analysis-confirm-modal.component';
import { AnalysisResultModalComponent } from '../../shared/components/analysis-result-modal/analysis-result-modal.component';
import { AnalysisV25ConfirmModalComponent, AnalysisV25ConfirmModalData } from '../../shared/components/analysis-v25-confirm-modal/analysis-v25-confirm-modal.component';
import { AnalysisProcessingModalComponent, AnalysisProcessingModalData } from '../../shared/components/analysis-processing-modal/analysis-processing-modal.component';
import { PrdResultModalComponent, PrdResultModalData } from '../../shared/components/prd-result-modal/prd-result-modal.component';
import { QuotaExceededModalComponent, QuotaExceededModalData } from '../../shared/components/quota-exceeded-modal/quota-exceeded-modal.component';
import { AnalysisV25Request, AnalysisV25Result } from '../../core/models/prd.model';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, GalleryGridComponent, LayoutSwitcherComponent, HeroSearchComponent],
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.css']
})
export class ExploreComponent implements OnInit {
  private projectService = inject(ProjectService);
  private prdService = inject(PrdService);
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
  isAnalyzing = this.prdService.state;
  isEstimating = signal<boolean>(false);

  // Processing modal overlay reference
  private processingOverlayRef: OverlayRef | null = null;

  // Loading toast ID for estimate
  private estimateToastId: string | null = null;

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

    // Show loading toast with spinner
    this.estimateToastId = this.toastService.loading('Estimating analysis cost...');
    this.isEstimating.set(true);

    // Call estimate API first
    this.analysisService.estimateAnalysis(event.url).subscribe({
      next: (response) => {
        // Dismiss loading toast
        if (this.estimateToastId) {
          this.toastService.dismiss(this.estimateToastId);
          this.estimateToastId = null;
        }
        this.isEstimating.set(false);

        if (response.success && response.data) {
          // Visual only → use old confirm modal + V2 analysis
          if (event.pipelineType === 'visual') {
            this.showOldConfirmModal(event, response.data);
          }
          // Technical/Both → use V2.5 confirm modal + V2.5 analysis
          else {
            this.showV25ConfirmationModal(event, response.data);
          }
        }
      },
      error: (error) => {
        // Dismiss loading toast
        if (this.estimateToastId) {
          this.toastService.dismiss(this.estimateToastId);
          this.estimateToastId = null;
        }
        this.isEstimating.set(false);

        if (error.status === 402) {
          this.showQuotaExceededModal();
        } else {
          const message = error.error?.message || 'Failed to estimate analysis cost';
          this.toastService.error(message);
        }
      }
    });
  }

  private showOldConfirmModal(event: SearchEvent, estimate: any): void {
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
      estimate: estimate,
      tokensRemaining: this.quotaService.tokensRemaining()
    } as AnalysisConfirmModalData;

    // Set close function
    componentRef.instance.close = (confirmed?: boolean) => {
      overlayRef.dispose();
      if (confirmed) {
        this.executeV2Analysis(event.url);
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

  private executeV2Analysis(url: string): void {
    this.analysisService.confirmAnalysis(url).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.showV2ResultModal(response.data);
        } else {
          this.toastService.error(response.message || 'Analysis failed');
        }
      },
      error: (error) => {
        if (error.status === 402) {
          this.showQuotaExceededModal();
        } else {
          const message = error.error?.message || 'Analysis failed';
          this.toastService.error(message);
        }
      }
    });
  }

  private showV2ResultModal(result: any): void {
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
    componentRef.instance.data = { result };

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

  private showV25ConfirmationModal(event: SearchEvent, estimate: any): void {
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
    const portal = new ComponentPortal(AnalysisV25ConfirmModalComponent);
    const componentRef = overlayRef.attach(portal);

    // Set data
    componentRef.instance.data = {
      url: event.url,
      pipelineType: event.pipelineType,
      detailLevel: event.detailLevel,
      tokensRemaining: this.quotaService.tokensRemaining(),
      estimatedTokens: estimate?.estimatedTokens || 0
    } as AnalysisV25ConfirmModalData;

    // Set close function
    componentRef.instance.close = (confirmed?: boolean) => {
      overlayRef.dispose();
      if (confirmed) {
        this.executeV25Analysis(event);
      } else {
        this.prdService.cancel();
      }
    };

    // Close on backdrop click
    overlayRef.backdropClick().subscribe(() => {
      overlayRef.dispose();
      this.prdService.cancel();
    });

    // Close on escape key
    overlayRef.keydownEvents().subscribe(event => {
      if (event.key === 'Escape') {
        overlayRef.dispose();
        this.prdService.cancel();
      }
    });
  }

  private executeV25Analysis(event: SearchEvent): void {
    // Show processing modal
    this.showProcessingModal(event);

    const request: AnalysisV25Request = {
      url: event.url,
      pipelineType: event.pipelineType,
      detailLevel: event.detailLevel
    };

    this.prdService.analyzeV25(request).subscribe({
      next: (response) => {
        // Close processing modal
        this.closeProcessingModal();

        if (response.success || response.data) {
          this.showPrdResultModal(response.data);
        } else {
          this.toastService.error(response.message || 'PRD generation failed');
        }
      },
      error: (error) => {
        // Close processing modal
        this.closeProcessingModal();

        if (error.status === 402) {
          this.showQuotaExceededModal();
        } else if (error.status === 504 || error.status === 408) {
          this.toastService.error('Analysis timed out. Try with a simpler website or lower detail level.');
        } else {
          const message = error.error?.message || 'An error occurred during PRD generation.';
          this.toastService.error(message);
        }
      }
    });
  }

  private showProcessingModal(event: SearchEvent): void {
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

    this.processingOverlayRef = this.overlay.create(config);
    const portal = new ComponentPortal(AnalysisProcessingModalComponent);
    const componentRef = this.processingOverlayRef.attach(portal);

    // Set data
    componentRef.instance.data = {
      url: event.url,
      pipelineType: event.pipelineType,
      detailLevel: event.detailLevel
    } as AnalysisProcessingModalData;

    // Set close function (for cancel)
    componentRef.instance.close = (cancelled?: boolean) => {
      if (cancelled) {
        this.prdService.cancel();
        this.closeProcessingModal();
        this.toastService.info('PRD generation cancelled');
      }
    };

    // Don't allow backdrop click to close during processing
    // User must use cancel button
  }

  private closeProcessingModal(): void {
    if (this.processingOverlayRef) {
      this.processingOverlayRef.dispose();
      this.processingOverlayRef = null;
    }
  }

  private showPrdResultModal(result: AnalysisV25Result): void {
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
    const portal = new ComponentPortal(PrdResultModalComponent);
    const componentRef = overlayRef.attach(portal);

    // Set data
    componentRef.instance.data = { result } as PrdResultModalData;

    // Set close function
    componentRef.instance.close = () => {
      overlayRef.dispose();
      this.prdService.reset();
    };

    // Close on backdrop click
    overlayRef.backdropClick().subscribe(() => {
      overlayRef.dispose();
      this.prdService.reset();
    });

    // Close on escape key
    overlayRef.keydownEvents().subscribe(event => {
      if (event.key === 'Escape') {
        overlayRef.dispose();
        this.prdService.reset();
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
      this.prdService.reset();
    };

    // Close on backdrop click
    overlayRef.backdropClick().subscribe(() => {
      overlayRef.dispose();
      this.prdService.reset();
    });

    // Close on escape key
    overlayRef.keydownEvents().subscribe(event => {
      if (event.key === 'Escape') {
        overlayRef.dispose();
        this.prdService.reset();
      }
    });
  }
}
