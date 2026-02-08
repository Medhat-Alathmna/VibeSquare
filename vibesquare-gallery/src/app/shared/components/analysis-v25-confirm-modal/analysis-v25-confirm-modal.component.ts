import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';
import {
    PipelineType,
    DetailLevel,
    ApiStyle,
    PIPELINE_TYPE_OPTIONS,
    DETAIL_LEVEL_OPTIONS,
    getEstimatedTime,
    PreflightData,
    PreflightQuestion,
    PreflightClarificationResponse
} from '../../../core/models/prd.model';
import { PrdService } from '../../../core/services/prd.service';

export interface AnalysisV25ConfirmModalData {
    url: string;
    pipelineType: PipelineType;
    detailLevel: DetailLevel;
    tokensRemaining: number;
    estimatedTokens?: number;
    preflightData: PreflightData | null;
}

export interface AnalysisV25ConfirmModalResult {
    confirmed: boolean;
    pipelineType: PipelineType;
    detailLevel: DetailLevel;
    apiStyle: ApiStyle;
    clarificationResponses: PreflightClarificationResponse[];
}

@Component({
    selector: 'app-analysis-v25-confirm-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonComponent],
    templateUrl: './analysis-v25-confirm-modal.component.html',
    styleUrls: ['./analysis-v25-confirm-modal.component.css']
})
export class AnalysisV25ConfirmModalComponent implements OnInit {
    private prdService = inject(PrdService);

    // These will be set by the modal opener
    data!: AnalysisV25ConfirmModalData;
    close!: (result?: AnalysisV25ConfirmModalResult) => void;

    isProcessing = signal(false);
    cachedResultAvailable = signal<boolean>(false);

    // Preflight answer tracking
    answers = signal<Map<string, string[]>>(new Map());
    customAnswers = signal<Map<string, string>>(new Map());
    selectedApiStyle = signal<ApiStyle>('REST');

    // Computed: group questions by priority
    criticalQuestions = computed(() =>
        this.preflightQuestions().filter(q => q.priority === 'critical')
    );
    importantQuestions = computed(() =>
        this.preflightQuestions().filter(q => q.priority === 'important')
    );
    optionalQuestions = computed(() =>
        this.preflightQuestions().filter(q => q.priority === 'optional')
    );
    answeredCount = computed(() => this.answers().size);

    get hasPreflightData(): boolean {
        return !!this.data.preflightData;
    }

    get visualSummary() {
        return this.data.preflightData?.visualSummary ?? null;
    }

    preflightQuestions(): PreflightQuestion[] {
        return this.data.preflightData?.questions ?? [];
    }

    get estimatedTime(): string {
        return getEstimatedTime(this.data.pipelineType, this.data.detailLevel);
    }

    get pipelineLabel(): string {
        const option = PIPELINE_TYPE_OPTIONS.find(o => o.value === this.data.pipelineType);
        return option?.label || this.data.pipelineType;
    }

    get pipelineDescription(): string {
        const option = PIPELINE_TYPE_OPTIONS.find(o => o.value === this.data.pipelineType);
        return option?.description || '';
    }

    get detailLabel(): string {
        const option = DETAIL_LEVEL_OPTIONS.find(o => o.value === this.data.detailLevel);
        return option?.label || this.data.detailLevel;
    }

    get detailDescription(): string {
        const option = DETAIL_LEVEL_OPTIONS.find(o => o.value === this.data.detailLevel);
        return option?.description || '';
    }

    get pipelineIcon(): string {
        const icons: Record<PipelineType, string> = {
            visual: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
            technical: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
            both: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
        };
        return icons[this.data.pipelineType];
    }

    get estimatedTokens(): number {
        return this.data.estimatedTokens || 0;
    }

    get hasEnoughTokens(): boolean {
        return this.data.tokensRemaining >= this.estimatedTokens;
    }

    get tokensAfter(): number {
        return Math.max(0, this.data.tokensRemaining - this.estimatedTokens);
    }

    get shortage(): number {
        return Math.max(0, this.estimatedTokens - this.data.tokensRemaining);
    }

    formatNumber(num: number): string {
        return num.toLocaleString();
    }

    ngOnInit(): void {
        if (this.data?.url) {
            this.checkCachedResult(this.data.url);
        }
        // Pre-select recommended options
        if (this.data?.preflightData?.questions) {
            const initialAnswers = new Map<string, string[]>();
            for (const question of this.data.preflightData.questions) {
                const recommended = question.options
                    .filter(o => o.isRecommended)
                    .map(o => o.value);
                if (recommended.length > 0) {
                    initialAnswers.set(question.id, recommended);
                }
            }
            this.answers.set(initialAnswers);
        }
    }

    private checkCachedResult(url: string): void {
        this.prdService.checkCache(url).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.cachedResultAvailable.set(response.data.cached);
                }
            },
            error: (err) => {
                console.warn('Failed to check cached result:', err);
            }
        });
    }

    toggleOption(questionId: string, value: string, allowMultiple: boolean): void {
        this.answers.update(map => {
            const newMap = new Map(map);
            const current = newMap.get(questionId) || [];

            if (allowMultiple) {
                // Toggle checkbox
                if (current.includes(value)) {
                    const filtered = current.filter(v => v !== value);
                    if (filtered.length > 0) {
                        newMap.set(questionId, filtered);
                    } else {
                        newMap.delete(questionId);
                    }
                } else {
                    newMap.set(questionId, [...current, value]);
                }
            } else {
                // Radio: replace
                newMap.set(questionId, [value]);
            }

            return newMap;
        });
    }

    isOptionSelected(questionId: string, value: string): boolean {
        return this.answers().get(questionId)?.includes(value) ?? false;
    }

    updateCustomAnswer(questionId: string, value: string): void {
        this.customAnswers.update(map => {
            const newMap = new Map(map);
            if (value.trim()) {
                newMap.set(questionId, value);
            } else {
                newMap.delete(questionId);
            }
            return newMap;
        });
    }

    getCustomAnswer(questionId: string): string {
        return this.customAnswers().get(questionId) ?? '';
    }

    private buildClarificationResponses(): PreflightClarificationResponse[] {
        const responses: PreflightClarificationResponse[] = [];
        const answersMap = this.answers();
        const customMap = this.customAnswers();

        for (const question of this.preflightQuestions()) {
            const selected = answersMap.get(question.id);
            const custom = customMap.get(question.id);

            if (selected?.length || custom) {
                responses.push({
                    questionId: question.id,
                    selectedValues: selected || [],
                    customAnswer: custom || undefined
                });
            }
        }

        return responses;
    }

    onConfirm(): void {
        if (!this.hasEnoughTokens) return;
        this.isProcessing.set(true);
        this.close({
            confirmed: true,
            pipelineType: this.data.pipelineType,
            detailLevel: this.data.detailLevel,
            apiStyle: this.selectedApiStyle(),
            clarificationResponses: this.buildClarificationResponses()
        });
    }

    onCancel(): void {
        this.close(undefined);
    }
}
