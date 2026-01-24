import { Component, input, computed, ElementRef, ViewChild, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-markdown-viewer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './markdown-viewer.component.html',
    styleUrls: ['./markdown-viewer.component.css']
})
export class MarkdownViewerComponent implements AfterViewInit {
    content = input.required<string>();
    maxHeight = input<string>('none');

    @ViewChild('contentContainer') contentContainer!: ElementRef<HTMLDivElement>;

    renderedHtml = computed(() => this.parseMarkdown(this.content()));

    constructor() {
        // Re-render when content changes
        effect(() => {
            const html = this.renderedHtml();
            if (this.contentContainer?.nativeElement) {
                this.contentContainer.nativeElement.innerHTML = html;
                this.highlightCodeBlocks();
            }
        });
    }

    ngAfterViewInit(): void {
        if (this.contentContainer?.nativeElement) {
            this.contentContainer.nativeElement.innerHTML = this.renderedHtml();
            this.highlightCodeBlocks();
        }
    }

    private parseMarkdown(markdown: string): string {
        if (!markdown) return '';

        let html = markdown;

        // Escape HTML first to prevent XSS
        html = this.escapeHtml(html);

        // Code blocks (``` ... ```)
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
            const language = lang || 'plaintext';
            return `<pre class="code-block" data-language="${language}"><code class="language-${language}">${code.trim()}</code></pre>`;
        });

        // Inline code (`...`)
        html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

        // Headers
        html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
        html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
        html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

        // Bold and Italic
        html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
        html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
        html = html.replace(/_(.+?)_/g, '<em>$1</em>');

        // Strikethrough
        html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

        // Horizontal rule
        html = html.replace(/^---+$/gm, '<hr>');
        html = html.replace(/^\*\*\*+$/gm, '<hr>');

        // Blockquotes
        html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

        // Unordered lists
        html = html.replace(/^[\-\*]\s+(.+)$/gm, '<li class="ul-item">$1</li>');
        html = html.replace(/(<li class="ul-item">.*<\/li>\n?)+/g, '<ul>$&</ul>');

        // Ordered lists
        html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ol-item">$1</li>');
        html = html.replace(/(<li class="ol-item">.*<\/li>\n?)+/g, '<ol>$&</ol>');

        // Checkboxes
        html = html.replace(/\[\s\]/g, '<input type="checkbox" disabled>');
        html = html.replace(/\[x\]/gi, '<input type="checkbox" checked disabled>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        // Images
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');

        // Tables (basic support)
        html = this.parseTables(html);

        // Paragraphs - wrap remaining text blocks
        html = html.replace(/^(?!<[huplob]|<hr|<pre|<table)(.+)$/gm, '<p>$1</p>');

        // Clean up empty paragraphs
        html = html.replace(/<p>\s*<\/p>/g, '');

        // Fix double newlines
        html = html.replace(/\n\n+/g, '\n');

        return html;
    }

    private parseTables(html: string): string {
        // Match table patterns
        const tableRegex = /^\|(.+)\|\s*\n\|([\s\-:|]+)\|\s*\n((?:\|.+\|\s*\n?)+)/gm;

        return html.replace(tableRegex, (match, headerRow, separatorRow, bodyRows) => {
            // Parse header
            const headers = headerRow.split('|').map((h: string) => h.trim()).filter((h: string) => h);
            const headerHtml = headers.map((h: string) => `<th>${h}</th>`).join('');

            // Parse alignment from separator
            const alignments = separatorRow.split('|').map((s: string) => {
                s = s.trim();
                if (s.startsWith(':') && s.endsWith(':')) return 'center';
                if (s.endsWith(':')) return 'right';
                return 'left';
            }).filter((_: string, i: number) => i < headers.length);

            // Parse body rows
            const rows = bodyRows.trim().split('\n').map((row: string) => {
                const cells = row.split('|').map((c: string) => c.trim()).filter((c: string, i: number, arr: string[]) => i > 0 && i < arr.length - 1);
                const cellsHtml = cells.map((c: string, i: number) => `<td style="text-align: ${alignments[i] || 'left'}">${c}</td>`).join('');
                return `<tr>${cellsHtml}</tr>`;
            }).join('');

            return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${rows}</tbody></table>`;
        });
    }

    private escapeHtml(text: string): string {
        // Don't escape markdown syntax characters
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    private highlightCodeBlocks(): void {
        // Apply basic syntax highlighting classes
        // This can be enhanced with highlight.js if available
        const codeBlocks = this.contentContainer?.nativeElement?.querySelectorAll('pre code');
        codeBlocks?.forEach((block: Element) => {
            // Add line numbers styling
            const lines = block.textContent?.split('\n') || [];
            if (lines.length > 1) {
                block.classList.add('has-line-numbers');
            }
        });
    }
}
