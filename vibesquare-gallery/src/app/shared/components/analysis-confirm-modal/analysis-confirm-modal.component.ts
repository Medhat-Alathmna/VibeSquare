import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisEstimate } from '../../../core/models/analysis.model';
import { ButtonComponent } from '../button/button.component';

export interface AnalysisConfirmModalData {
    estimate: AnalysisEstimate;
    tokensRemaining: number;
}

@Component({
    selector: 'app-analysis-confirm-modal',
    standalone: true,
    imports: [CommonModule, ButtonComponent],
    templateUrl: './analysis-confirm-modal.component.html',
    styleUrls: ['./analysis-confirm-modal.component.css']
})
export class AnalysisConfirmModalComponent {
    // These will be set by the modal service
    data!: AnalysisConfirmModalData;
    close!: (result?: boolean) => void;

    isProcessing = signal(false);

    get estimate(): AnalysisEstimate {
        return this.data.estimate;
    }

    get hasEnoughTokens(): boolean {
        return this.data.tokensRemaining >= this.data.estimate.estimatedTokens;
    }

    get tokensAfter(): number {
        return Math.max(0, this.data.tokensRemaining - this.data.estimate.estimatedTokens);
    }

    get shortage(): number {
        return Math.max(0, this.data.estimate.estimatedTokens - this.data.tokensRemaining);
    }

    formatNumber(num: number): string {
        return num.toLocaleString();
    }

    onConfirm(): void {
        if (!this.hasEnoughTokens) return;
        this.isProcessing.set(true);
        this.close(true);
    }

    onCancel(): void {
        this.close(false);
    }
}
