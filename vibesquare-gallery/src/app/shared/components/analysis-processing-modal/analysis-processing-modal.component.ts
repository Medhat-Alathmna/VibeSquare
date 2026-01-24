import { Component, inject, computed, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrdService } from '../../../core/services/prd.service';
import {
    PipelineType,
    DetailLevel,
    getEstimatedTime
} from '../../../core/models/prd.model';

export interface AnalysisProcessingModalData {
    url: string;
    pipelineType: PipelineType;
    detailLevel: DetailLevel;
}

interface ProcessingStep {
    label: string;
    description: string;
    threshold: number; // Progress percentage threshold to mark as complete
}

@Component({
    selector: 'app-analysis-processing-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './analysis-processing-modal.component.html',
    styleUrls: ['./analysis-processing-modal.component.css']
})
export class AnalysisProcessingModalComponent implements OnDestroy {
    private prdService = inject(PrdService);

    // Set by modal opener
    data!: AnalysisProcessingModalData;
    close!: (cancelled?: boolean) => void;

    // Progress from service
    progress = this.prdService.progress;
    state = this.prdService.state;

    // Cancel confirmation
    showCancelConfirm = signal(false);

    // Processing steps based on pipeline type
    get steps(): ProcessingStep[] {
        if (this.data.pipelineType === 'visual') {
            return [
                { label: 'Capturing page', description: 'Taking screenshot & extracting DOM', threshold: 15 },
                { label: 'Analyzing design', description: 'Identifying layout & components', threshold: 40 },
                { label: 'Generating specs', description: 'Creating visual specifications', threshold: 70 },
                { label: 'Finalizing', description: 'Preparing PRD document', threshold: 90 }
            ];
        } else if (this.data.pipelineType === 'technical') {
            return [
                { label: 'Analyzing structure', description: 'Parsing UI components', threshold: 10 },
                { label: 'Database schema', description: 'Inferring data models', threshold: 30 },
                { label: 'Backend design', description: 'Generating API & security specs', threshold: 55 },
                { label: 'QA validation', description: 'Verifying alignment', threshold: 80 },
                { label: 'Finalizing', description: 'Compiling PRD document', threshold: 90 }
            ];
        } else {
            // 'both' - full pipeline
            return [
                { label: 'Capturing page', description: 'Screenshot & DOM extraction', threshold: 8 },
                { label: 'Visual analysis', description: 'Layout & design specs', threshold: 25 },
                { label: 'Database schema', description: 'Inferring data models', threshold: 40 },
                { label: 'Backend design', description: 'API, security & DevOps', threshold: 60 },
                { label: 'QA validation', description: 'Frontend-backend alignment', threshold: 80 },
                { label: 'Finalizing', description: 'Compiling PRD document', threshold: 90 }
            ];
        }
    }

    get estimatedTime(): string {
        return getEstimatedTime(this.data.pipelineType, this.data.detailLevel);
    }

    get currentStepIndex(): number {
        const currentProgress = this.progress();
        for (let i = this.steps.length - 1; i >= 0; i--) {
            if (currentProgress >= this.steps[i].threshold) {
                return Math.min(i + 1, this.steps.length - 1);
            }
        }
        return 0;
    }

    get currentStepLabel(): string {
        return this.steps[this.currentStepIndex]?.label || 'Processing...';
    }

    isStepComplete(stepIndex: number): boolean {
        return this.progress() >= this.steps[stepIndex].threshold;
    }

    isStepActive(stepIndex: number): boolean {
        return stepIndex === this.currentStepIndex && !this.isStepComplete(stepIndex);
    }

    onCancelClick(): void {
        this.showCancelConfirm.set(true);
    }

    onConfirmCancel(): void {
        this.prdService.cancel();
        this.close(true);
    }

    onDismissCancel(): void {
        this.showCancelConfirm.set(false);
    }

    ngOnDestroy(): void {
        // Cleanup if needed
    }
}
