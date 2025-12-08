import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="bg-dark-surface border-t border-dark-border mt-20">
      <div class="container mx-auto px-4 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">

          <!-- Brand -->
          <div class="col-span-1 md:col-span-2">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                <span class="text-black font-bold text-xl">V</span>
              </div>
              <span class="text-xl font-display font-bold text-white">VibeSquare</span>
            </div>
            <p class="text-gray-400 text-sm mb-4 max-w-md">
              Discover stunning AI-generated web projects created with VibeCode.
              Browse, explore, and download inspiring designs.
            </p>
            <div class="text-xs text-gray-500">
              © 2025 VibeSquare Gallery. All rights reserved.
            </div>
          </div>

          <!-- Quick Links -->
          <div>
            <h4 class="font-semibold text-white mb-4">Quick Links</h4>
            <ul class="space-y-2 text-sm">
              <li><a routerLink="/explore" class="text-gray-400 hover:text-secondary transition-colors">Explore</a></li>
              <li><a routerLink="/collections" class="text-gray-400 hover:text-secondary transition-colors">Collections</a></li>
              <li><a routerLink="/about" class="text-gray-400 hover:text-secondary transition-colors">About</a></li>
            </ul>
          </div>

          <!-- Social -->
          <div>
            <h4 class="font-semibold text-white mb-4">Connect</h4>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="text-gray-400 hover:text-secondary transition-colors">GitHub</a></li>
              <li><a href="#" class="text-gray-400 hover:text-secondary transition-colors">Twitter</a></li>
              <li><a href="#" class="text-gray-400 hover:text-secondary transition-colors">Discord</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {}
