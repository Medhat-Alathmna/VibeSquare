import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisResult } from '../../../core/models/analysis.model';
import { ButtonComponent } from '../button/button.component';
import { ClipboardService } from '../../../core/services/clipboard.service';

export interface AnalysisResultModalData {
    result: AnalysisResult;
}

@Component({
    selector: 'app-analysis-result-modal',
    standalone: true,
    imports: [CommonModule, ButtonComponent],
    templateUrl: './analysis-result-modal.component.html',
    styleUrls: ['./analysis-result-modal.component.css']
})
export class AnalysisResultModalComponent {
    private clipboardService = inject(ClipboardService);

    // These will be set by the modal service
    data!: AnalysisResultModalData;
    close!: () => void;

    copySuccess = signal(false);

    get result(): AnalysisResult {
        return this.data.result;
    }

    get prompt(): string {
        return this.result.prompt;
    }

    get metadata() {
        return this.result.metadata;
    }

    formatNumber(num: number): string {
        return num.toLocaleString();
    }

    async copyPrompt(): Promise<void> {
        const success = await this.clipboardService.copyToClipboard(this.prompt);
        if (success) {
            this.copySuccess.set(true);
            setTimeout(() => this.copySuccess.set(false), 2000);
        }
    }

    onClose(): void {
        this.close();
    }
}
