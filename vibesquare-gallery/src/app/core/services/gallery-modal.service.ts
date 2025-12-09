import { Injectable, inject, Type } from '@angular/core';
import { Overlay, OverlayRef, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Project } from '../models/project.model';
import { GalleryModalComponent } from '../../features/explore/components/gallery-modal/gallery-modal.component';

@Injectable({
  providedIn: 'root'
})
export class GalleryModalService {
  private overlay = inject(Overlay);
  private overlayRef: OverlayRef | null = null;

  open(project: Project): void {
    if (this.overlayRef) {
      this.close();
    }

    const config = new OverlayConfig({
      hasBackdrop: true,
      backdropClass: 'gallery-modal-backdrop',
      panelClass: 'gallery-modal-panel',
      positionStrategy: this.overlay.position()
        .global()
        .centerHorizontally()
        .centerVertically(),
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    this.overlayRef = this.overlay.create(config);

    // Close on backdrop click
    this.overlayRef.backdropClick().subscribe(() => this.close());

    // Close on escape key
    this.overlayRef.keydownEvents().subscribe(event => {
      if (event.key === 'Escape') {
        this.close();
      }
    });

    const portal = new ComponentPortal(GalleryModalComponent);
    const componentRef = this.overlayRef.attach(portal);

    // Set the project data
    componentRef.instance.project.set(project);

    // Set close callback
    componentRef.instance.closeModal = () => this.close();
  }

  close(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      document.body.style.overflow = '';
    }
  }

  isOpen(): boolean {
    return this.overlayRef !== null && this.overlayRef.hasAttached();
  }
}
