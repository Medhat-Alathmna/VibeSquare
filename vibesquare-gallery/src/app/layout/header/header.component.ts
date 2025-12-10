import { Component, signal, HostListener, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  private platformId = inject(PLATFORM_ID);

  mobileMenuOpen = signal(false);
  isVisible = signal(false);
  isScrolled = signal(false);

  private scrollThreshold = 300; // Show header after scrolling past hero

  @HostListener('window:scroll')
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      this.isVisible.set(scrollTop > this.scrollThreshold);
      this.isScrolled.set(scrollTop > 50);
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(v => !v);
  }
}
