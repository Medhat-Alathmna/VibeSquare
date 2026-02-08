import { Component, inject, computed, signal, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { PrdService } from '../../../core/services/prd.service';
import { SseService } from '../../../core/services/sse.service';
import {
    PipelineType,
    DetailLevel,
    getEstimatedTime,
    getCacheBadgeInfo,
    CacheBadgeInfo
} from '../../../core/models/prd.model';
import { ConfidenceBadgeComponent } from '../confidence-badge/confidence-badge.component';
import { ANALYSIS_TIPS, TIP_ROTATION_INTERVAL } from '../../../core/constants/analysis-tips';

export interface AnalysisProcessingModalData {
    url: string;
    pipelineType: PipelineType;
    detailLevel: DetailLevel;
    jobId?: string;
}

interface SiteMetadata {
    title?: string;
    description?: string;
    screenshot?: string;
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
    overallConfidence = this.prdService.overallConfidenceScore;
    sseConnectionState = this.sseService.connectionState;

    // Cache status from service
    cacheStatus = this.prdService.cacheStatus;
    isCached = this.prdService.isCachedResult;

    // Elapsed time tracking
    startTime = signal<number>(Date.now());
    elapsedSeconds = signal<number>(0);
    private elapsedInterval: ReturnType<typeof setInterval> | null = null;

    // Tips rotation
    currentTipIndex = signal<number>(0);
    currentTip = computed(() => ANALYSIS_TIPS[this.currentTipIndex()]);
    private tipInterval: ReturnType<typeof setInterval> | null = null;

    // Site metadata (will be extracted or received from backend)
    siteMetadata = signal<SiteMetadata>({
        title: undefined,
        description: undefined,
        screenshot: undefined
    });

    // Cancel confirmation
    showCancelConfirm = signal(false);

    get estimatedTime(): string {
        return getEstimatedTime(this.data.pipelineType, this.data.detailLevel);
    }

    get formattedElapsedTime(): string {
        const seconds = this.elapsedSeconds();
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    }

    get cacheBadgeInfo(): CacheBadgeInfo | null {
        const status = this.cacheStatus();
        if (status) {
            return getCacheBadgeInfo(status.cached);
        }
        return null;
    }

    // Lottie animation options
    lottieOptions = {
        path: '/assets/animations/analyzing.json',
        loop: true,
        autoplay: true
    };

    ngOnInit(): void {
        // Start elapsed time tracking
        this.startElapsedTimer();

        // Start tips rotation
        this.startTipRotation();

        // Extract site metadata from URL (basic extraction)
        this.extractSiteMetadata();

        // Connect to SSE if job ID is provided
        if (this.data.jobId) {
            this.connectToSSE(this.data.jobId);
        }
    }

    ngOnDestroy(): void {
        this.stopElapsedTimer();
        this.stopTipRotation();
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

    private startTipRotation(): void {
        // Shuffle tips on init for variety
        this.currentTipIndex.set(Math.floor(Math.random() * ANALYSIS_TIPS.length));

        this.tipInterval = setInterval(() => {
            this.currentTipIndex.update(i => (i + 1) % ANALYSIS_TIPS.length);
        }, TIP_ROTATION_INTERVAL);
    }

    private stopTipRotation(): void {
        if (this.tipInterval) {
            clearInterval(this.tipInterval);
            this.tipInterval = null;
        }
    }

    private extractSiteMetadata(): void {
        try {
            const url = new URL(this.data.url);
            const hostname = url.hostname.replace('www.', '');

            this.siteMetadata.set({
                title: this.capitalizeFirstLetter(hostname),
                description: `جاري تحليل ${hostname}...`,
                screenshot: undefined // Will be set from backend if available
            });
        } catch (error) {
            this.siteMetadata.set({
                title: this.data.url,
                description: 'جاري تحليل الموقع...',
                screenshot: undefined
            });
        }
    }

    private capitalizeFirstLetter(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    private connectToSSE(jobId: string): void {
        this.sseSubscription = this.sseService.streamPipelineUpdates(jobId).subscribe({
            next: (update) => {
                console.log('SSE Update:', update);

                // Update site metadata if received from backend
                if (update.type === 'agent_started' && (update as any).siteMetadata) {
                    const meta = (update as any).siteMetadata;
                    this.siteMetadata.update(current => ({
                        ...current,
                        ...meta
                    }));
                }
            },
            error: (error) => {
                console.error('SSE Error:', error);
            },
            complete: () => {
                console.log('SSE Stream completed');
            }
        });
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
