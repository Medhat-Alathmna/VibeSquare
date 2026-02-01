import { Component, inject, computed, signal, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { PrdService } from '../../../core/services/prd.service';
import { SseService } from '../../../core/services/sse.service';
import {
    PipelineType,
    DetailLevel,
    getEstimatedTime,
    AgentConfidence,
    getConfidenceIcon,
    formatAgentName,
    getCacheBadgeInfo,
    CacheBadgeInfo
} from '../../../core/models/prd.model';
import { ConfidenceBadgeComponent } from '../confidence-badge/confidence-badge.component';

export interface AnalysisProcessingModalData {
    url: string;
    pipelineType: PipelineType;
    detailLevel: DetailLevel;
    jobId?: string; // Optional job ID for SSE connection
}

interface ProcessingStep {
    label: string;
    description: string;
    threshold: number;
    agentName?: string; // Map to agent for confidence display
}

@Component({
    selector: 'app-analysis-processing-modal',
    standalone: true,
    imports: [CommonModule, ConfidenceBadgeComponent],
    templateUrl: './analysis-processing-modal.component.html',
    styleUrls: ['./analysis-processing-modal.component.css']
})
export class AnalysisProcessingModalComponent implements OnInit, OnDestroy {
    private prdService = inject(PrdService);
    private sseService = inject(SseService);
    private sseSubscription?: Subscription;

    // Set by modal opener
    data!: AnalysisProcessingModalData;
    close!: (cancelled?: boolean) => void;

    // Progress from service
    progress = this.prdService.progress;
    state = this.prdService.state;

    // V2.5 Confidence data from service
    completedAgents = this.prdService.completedAgents;
    currentAgent = this.prdService.currentAgent;
    overallConfidence = this.prdService.overallConfidenceScore;
    sseConnectionState = this.sseService.connectionState;

    // Cache status from service
    cacheStatus = this.prdService.cacheStatus;
    isCached = this.prdService.isCachedResult;

    // Elapsed time tracking
    startTime = signal<number>(Date.now());
    elapsedSeconds = signal<number>(0);
    private elapsedInterval: ReturnType<typeof setInterval> | null = null;

    // Cancel confirmation
    showCancelConfirm = signal(false);

    // Processing steps based on pipeline type with agent mapping
    get steps(): ProcessingStep[] {
        if (this.data.pipelineType === 'visual') {
            return [
                { label: 'Capturing page', description: 'Taking screenshot & extracting DOM', threshold: 15 },
                { label: 'Analyzing design', description: 'Identifying layout & components', threshold: 40, agentName: 'identity' },
                { label: 'Generating specs', description: 'Creating visual specifications', threshold: 70 },
                { label: 'Finalizing', description: 'Preparing PRD document', threshold: 90, agentName: 'prdValidator' }
            ];
        } else if (this.data.pipelineType === 'technical') {
            return [
                { label: 'Analyzing structure', description: 'Parsing UI components', threshold: 10, agentName: 'identity' },
                { label: 'Database schema', description: 'Inferring data models', threshold: 30, agentName: 'database' },
                { label: 'Backend design', description: 'Generating API & security specs', threshold: 55, agentName: 'backend' },
                { label: 'QA validation', description: 'Verifying alignment', threshold: 80, agentName: 'qa' },
                { label: 'Finalizing', description: 'Compiling PRD document', threshold: 90, agentName: 'prdValidator' }
            ];
        } else {
            // 'both' - full pipeline
            return [
                { label: 'Identity Analysis', description: 'Product vision & problem', threshold: 8, agentName: 'identity' },
                { label: 'Database Schema', description: 'Inferring data models', threshold: 25, agentName: 'database' },
                { label: 'Backend Design', description: 'API & architecture', threshold: 40, agentName: 'backend' },
                { label: 'Security Analysis', description: 'Security recommendations', threshold: 50, agentName: 'security' },
                { label: 'User Stories', description: 'Feature breakdown', threshold: 60, agentName: 'userStory' },
                { label: 'DevOps Config', description: 'Infrastructure setup', threshold: 70, agentName: 'devops' },
                { label: 'QA Validation', description: 'Quality assurance', threshold: 85, agentName: 'qa' },
                { label: 'Finalizing', description: 'Compiling PRD document', threshold: 95, agentName: 'prdValidator' }
            ];
        }
    }

    get estimatedTime(): string {
        return getEstimatedTime(this.data.pipelineType, this.data.detailLevel);
    }

    get formattedElapsedTime(): string {
        const seconds = this.elapsedSeconds();
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
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
        const agent = this.currentAgent();
        if (agent) {
            return formatAgentName(agent);
        }
        return this.steps[this.currentStepIndex]?.label || 'Processing...';
    }

    get cacheBadgeInfo(): CacheBadgeInfo | null {
        const status = this.cacheStatus();
        if (status) {
            return getCacheBadgeInfo(status.cached);
        }
        return null;
    }

    ngOnInit(): void {
        // Start elapsed time tracking
        this.startElapsedTimer();

        // Connect to SSE if job ID is provided
        if (this.data.jobId) {
            this.connectToSSE(this.data.jobId);
        }
    }

    ngOnDestroy(): void {
        this.stopElapsedTimer();
        this.sseSubscription?.unsubscribe();
        this.sseService.disconnect();
    }

    private startElapsedTimer(): void {
        this.startTime.set(Date.now());
        this.elapsedInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime()) / 1000);
            this.elapsedSeconds.set(elapsed);
        }, 1000);
    }

    private stopElapsedTimer(): void {
        if (this.elapsedInterval) {
            clearInterval(this.elapsedInterval);
            this.elapsedInterval = null;
        }
    }

    private connectToSSE(jobId: string): void {
        this.sseSubscription = this.sseService.streamPipelineUpdates(jobId).subscribe({
            next: (update) => {
                // Updates are handled by SseService -> PrdService
                console.log('SSE Update:', update);
            },
            error: (error) => {
                console.error('SSE Error:', error);
                // Fallback to simulation if SSE fails
            },
            complete: () => {
                console.log('SSE Stream completed');
            }
        });
    }

    isStepComplete(stepIndex: number): boolean {
        const step = this.steps[stepIndex];

        // Check if this step's agent is in completed agents
        if (step.agentName) {
            const completed = this.completedAgents();
            return completed.some(a => a.name === step.agentName);
        }

        return this.progress() >= step.threshold;
    }

    isStepActive(stepIndex: number): boolean {
        const step = this.steps[stepIndex];
        const agent = this.currentAgent();

        // Check if this step's agent is currently running
        if (step.agentName && agent) {
            return step.agentName === agent;
        }

        return stepIndex === this.currentStepIndex && !this.isStepComplete(stepIndex);
    }

    getAgentConfidence(agentName: string | undefined): AgentConfidence | undefined {
        if (!agentName) return undefined;
        return this.completedAgents().find(a => a.name === agentName);
    }

    getConfidenceIcon(agentName: string | undefined): string {
        const agent = this.getAgentConfidence(agentName);
        if (agent) {
            return getConfidenceIcon(agent.level);
        }
        return '';
    }

    onCancelClick(): void {
        this.showCancelConfirm.set(true);
    }

    onConfirmCancel(): void {
        this.sseService.disconnect();
        this.prdService.cancel();
        this.close(true);
    }

    onDismissCancel(): void {
        this.showCancelConfirm.set(false);
    }
}
