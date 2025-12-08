import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import hljs from 'highlight.js';
import { ClipboardService } from '../../../core/services/clipboard.service';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-code-viewer',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="relative group">
      <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <app-button
          variant="ghost"
          size="sm"
          (click)="copyCode()">
          {{ copied() ? 'Copied!' : 'Copy' }}
        </app-button>
      </div>

      <pre class="rounded-lg bg-dark-surface p-4 overflow-x-auto scrollbar-thin">
        <code
          [class]="'language-' + language"
          [innerHTML]="highlightedCode()">
        </code>
      </pre>
    </div>
  `
})
export class CodeViewerComponent implements OnInit {
  @Input() code: string = '';
  @Input() language: string = 'typescript';

  highlightedCode = signal<string>('');
  copied = signal<boolean>(false);

  constructor(private clipboardService: ClipboardService) {}

  ngOnInit() {
    this.highlightCode();
  }

  private highlightCode() {
    try {
      const highlighted = hljs.highlight(this.code, {
        language: this.language
      }).value;
      this.highlightedCode.set(highlighted);
    } catch (error) {
      console.error('Highlighting failed:', error);
      this.highlightedCode.set(this.code);
    }
  }

  async copyCode() {
    const success = await this.clipboardService.copyToClipboard(this.code);
    if (success) {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }
}
