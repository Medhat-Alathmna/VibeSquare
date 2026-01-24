import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrdDetail, getValidationScoreColor, formatPipelineType, formatDetailLevel } from '../../../core/models/prd.model';
import { ButtonComponent } from '../button/button.component';
import { MarkdownViewerComponent } from '../markdown-viewer/markdown-viewer.component';
import { ClipboardService } from '../../../core/services/clipboard.service';
import { PrdService } from '../../../core/services/prd.service';
import { ToastService } from '../../../core/services/toast.service';

export interface PrdViewerModalData {
    prd: PrdDetail;
}

@Component({
    selector: 'app-prd-viewer-modal',
    standalone: true,
    imports: [CommonModule, ButtonComponent, MarkdownViewerComponent],
    templateUrl: './prd-viewer-modal.component.html',
    styleUrls: ['./prd-viewer-modal.component.css']
})
export class PrdViewerModalComponent {
    private clipboardService = inject(ClipboardService);
    private prdService = inject(PrdService);
    private toastService = inject(ToastService);

    // Set by modal opener
    data!: PrdViewerModalData;
    close!: () => void;

    copySuccess = signal(false);
    downloading = signal(false);
    activeTab = signal<'preview' | 'raw'>('preview');

    get prd(): PrdDetail {
        return this.data.prd;
    }

    get prdMarkdown(): string {
        return this.prd.prdMarkdown;
    }

    get validationScoreColor(): string {
        return getValidationScoreColor(this.prd.validationScore);
    }

    get pipelineTypeLabel(): string {
        return formatPipelineType(this.prd.pipelineType);
    }

    get detailLevelLabel(): string {
        return formatDetailLevel(this.prd.detailLevel);
    }

    get createdDate(): string {
        return new Date(this.prd.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
        this.prdService.downloadPrd(this.prd.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `prd-${this.prd.id.slice(0, 8)}.md`;
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
