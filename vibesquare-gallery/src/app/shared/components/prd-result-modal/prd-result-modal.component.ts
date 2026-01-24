import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisV25Result, getValidationScoreColor, formatPipelineType, formatDetailLevel } from '../../../core/models/prd.model';
import { ButtonComponent } from '../button/button.component';
import { MarkdownViewerComponent } from '../markdown-viewer/markdown-viewer.component';
import { ClipboardService } from '../../../core/services/clipboard.service';
import { PrdService } from '../../../core/services/prd.service';
import { ToastService } from '../../../core/services/toast.service';

export interface PrdResultModalData {
    result: AnalysisV25Result;
}

@Component({
    selector: 'app-prd-result-modal',
    standalone: true,
    imports: [CommonModule, ButtonComponent, MarkdownViewerComponent],
    templateUrl: './prd-result-modal.component.html',
    styleUrls: ['./prd-result-modal.component.css']
})
export class PrdResultModalComponent {
    private clipboardService = inject(ClipboardService);
    private prdService = inject(PrdService);
    private toastService = inject(ToastService);

    // Set by modal opener
    data!: PrdResultModalData;
    close!: () => void;

    copySuccess = signal(false);
    downloading = signal(false);
    activeTab = signal<'preview' | 'raw'>('preview');

    get result(): AnalysisV25Result {
        return this.data.result;
    }

    get prdMarkdown(): string {
        return this.result.prdMarkdown;
    }

    get metadata() {
        return this.result.metadata;
    }

    get validationScoreColor(): string {
        return getValidationScoreColor(this.metadata.validationScore);
    }

    get pipelineTypeLabel(): string {
        return formatPipelineType(this.metadata.pipelineType);
    }

    get detailLevelLabel(): string {
        return formatDetailLevel(this.metadata.detailLevel);
    }

    get processingTimeSeconds(): string {
        return (this.metadata.processingTimeMs / 1000).toFixed(1);
    }

    formatNumber(num: number): string {
        return num.toLocaleString();
    }

    async copyPrd(): Promise<void> {
        const success = await this.clipboardService.copyToClipboard(this.prdMarkdown);
        if (success) {
            this.copySuccess.set(true);
            this.toastService.success('PRD copied to clipboard');
            setTimeout(() => this.copySuccess.set(false), 2000);
        } else {
            this.toastService.error('Failed to copy PRD');
        }
    }

    downloadPrd(): void {
        this.downloading.set(true);
        this.prdService.downloadPrd(this.result.prdId).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `prd-${this.result.prdId.slice(0, 8)}.md`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                this.downloading.set(false);
                this.toastService.success('PRD downloaded successfully');
            },
            error: () => {
                this.downloading.set(false);
                this.toastService.error('Failed to download PRD');
            }
        });
    }

    switchTab(tab: 'preview' | 'raw'): void {
        this.activeTab.set(tab);
    }

    onClose(): void {
        this.close();
    }
}
