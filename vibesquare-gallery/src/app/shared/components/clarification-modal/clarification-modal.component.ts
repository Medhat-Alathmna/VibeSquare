import { Component, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    ClarificationQuestion,
    ClarificationResponse,
    formatAgentName
} from '../../../core/models/prd.model';
import { ConfidenceBadgeComponent } from '../confidence-badge/confidence-badge.component';

export interface ClarificationModalData {
    questions: ClarificationQuestion[];
    overallConfidence: number;
}

@Component({
    selector: 'app-clarification-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, ConfidenceBadgeComponent],
    template: `
        <div class="modal-content max-w-2xl">
            <!-- Header -->
            <div class="modal-header">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <span class="text-xl">🔍</span>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-lg font-display font-bold text-white">Additional Clarification Needed</h3>
                        <p class="text-sm text-gray-400">Help us improve the analysis accuracy</p>
                    </div>
                    @if (data.overallConfidence > 0) {
                        <app-confidence-badge
                            [score]="data.overallConfidence"
                            size="sm"
                            [showLabel]="true" />
                    }
                </div>
            </div>

            <!-- Body -->
            <div class="modal-body max-h-[60vh] overflow-y-auto">
                <!-- Explanation -->
                <div class="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p class="text-sm text-yellow-200/80">
                        Our analysis identified some areas that would benefit from your input.
                        Answering these questions will help generate a more accurate PRD.
                    </p>
                </div>

                <!-- Questions by Priority -->
                @if (criticalQuestions().length > 0) {
                    <div class="mb-6">
                        <h4 class="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                            <span>🔴</span>
                            <span>Critical Questions ({{ criticalQuestions().length }})</span>
                        </h4>
                        <div class="space-y-4">
                            @for (q of criticalQuestions(); track q.id) {
                                <ng-container *ngTemplateOutlet="questionTemplate; context: { $implicit: q }"></ng-container>
                            }
                        </div>
                    </div>
                }

                @if (importantQuestions().length > 0) {
                    <div class="mb-6">
                        <h4 class="text-sm font-medium text-yellow-400 mb-3 flex items-center gap-2">
                            <span>🟠</span>
                            <span>Important Questions ({{ importantQuestions().length }})</span>
                        </h4>
                        <div class="space-y-4">
                            @for (q of importantQuestions(); track q.id) {
                                <ng-container *ngTemplateOutlet="questionTemplate; context: { $implicit: q }"></ng-container>
                            }
                        </div>
                    </div>
                }

                @if (optionalQuestions().length > 0) {
                    <div class="mb-6">
                        <h4 class="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                            <span>🟢</span>
                            <span>Optional Questions ({{ optionalQuestions().length }})</span>
                        </h4>
                        <div class="space-y-4">
                            @for (q of optionalQuestions(); track q.id) {
                                <ng-container *ngTemplateOutlet="questionTemplate; context: { $implicit: q }"></ng-container>
                            }
                        </div>
                    </div>
                }

                <!-- Question Template -->
                <ng-template #questionTemplate let-question>
                    <div class="p-4 bg-dark-bg rounded-lg border border-dark-border">
                        <!-- Question Header -->
                        <div class="flex items-start justify-between mb-2">
                            <p class="text-white font-medium">{{ question.question }}</p>
                            <span class="text-xs text-gray-500 bg-dark-surface px-2 py-0.5 rounded flex-shrink-0 ml-2">
                                {{ getAgentDisplayName(question.agentName) }}
                            </span>
                        </div>

                        <!-- Context -->
                        @if (question.context) {
                            <p class="text-sm text-gray-400 mb-3">
                                <span class="text-gray-500">Context:</span> {{ question.context }}
                            </p>
                        }

                        <!-- Answer Input -->
                        @if (question.options && question.options.length > 0) {
                            <!-- Radio Options -->
                            <div class="space-y-2">
                                @for (option of question.options; track option) {
                                    <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-surface cursor-pointer transition-colors">
                                        <input
                                            type="radio"
                                            [name]="'question-' + question.id"
                                            [value]="option"
                                            (change)="setAnswer(question.id, option)"
                                            class="w-4 h-4 text-secondary bg-dark-bg border-dark-border focus:ring-secondary focus:ring-offset-dark-bg" />
                                        <span class="text-sm text-gray-300">{{ option }}</span>
                                    </label>
                                }
                                <!-- Other option -->
                                <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-surface cursor-pointer transition-colors">
                                    <input
                                        type="radio"
                                        [name]="'question-' + question.id"
                                        value="__other__"
                                        (change)="enableOtherInput(question.id)"
                                        class="w-4 h-4 text-secondary bg-dark-bg border-dark-border focus:ring-secondary focus:ring-offset-dark-bg" />
                                    <span class="text-sm text-gray-300">Other:</span>
                                </label>
                                @if (otherInputEnabled()[question.id]) {
                                    <input
                                        type="text"
                                        [placeholder]="'Specify your answer...'"
                                        (input)="setAnswer(question.id, $any($event.target).value)"
                                        class="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-secondary ml-7" />
                                }
                            </div>
                        } @else {
                            <!-- Text Input -->
                            <textarea
                                [placeholder]="'Enter your answer...'"
                                (input)="setAnswer(question.id, $any($event.target).value)"
                                rows="3"
                                class="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-secondary resize-none"></textarea>
                        }
                    </div>
                </ng-template>

                <!-- Progress Indicator -->
                <div class="mt-6 pt-4 border-t border-dark-border">
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-400">Answered</span>
                        <span class="text-white font-medium">{{ answeredCount() }} / {{ data.questions.length }}</span>
                    </div>
                    <div class="mt-2 h-1.5 bg-dark-bg rounded-full overflow-hidden">
                        <div
                            class="h-full bg-secondary rounded-full transition-all duration-300"
                            [style.width.%]="(answeredCount() / data.questions.length) * 100">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="modal-footer flex items-center justify-between">
                <button
                    (click)="onSkip()"
                    class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-dark-border/50">
                    Skip for now
                </button>
                <button
                    (click)="onSubmit()"
                    [disabled]="answeredCount() === 0"
                    class="px-5 py-2 text-sm font-medium bg-secondary text-black rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    <span>Submit Answers</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }

        .modal-content {
            @apply bg-dark-surface border border-dark-border rounded-2xl overflow-hidden;
        }

        .modal-header {
            @apply p-5 border-b border-dark-border;
        }

        .modal-body {
            @apply p-5;
        }

        .modal-footer {
            @apply p-5 border-t border-dark-border;
        }
    `]
})
export class ClarificationModalComponent {
    // Set by modal opener
    data!: ClarificationModalData;
    close!: (result?: ClarificationResponse[] | null) => void;

    // State
    private answers = signal<Map<string, string>>(new Map());
    otherInputEnabled = signal<Record<string, boolean>>({});

    // Computed
    criticalQuestions = computed(() =>
        this.data.questions.filter(q => q.priority === 'critical')
    );

    importantQuestions = computed(() =>
        this.data.questions.filter(q => q.priority === 'important')
    );

    optionalQuestions = computed(() =>
        this.data.questions.filter(q => q.priority === 'optional')
    );

    answeredCount = computed(() => {
        const answered = this.answers();
        return Array.from(answered.values()).filter(v => v.trim().length > 0).length;
    });

    getAgentDisplayName(agentName: string): string {
        return formatAgentName(agentName);
    }

    setAnswer(questionId: string, answer: string): void {
        this.answers.update(map => {
            const newMap = new Map(map);
            newMap.set(questionId, answer);
            return newMap;
        });
    }

    enableOtherInput(questionId: string): void {
        this.otherInputEnabled.update(state => ({
            ...state,
            [questionId]: true
        }));
        // Clear any previous answer for this question
        this.setAnswer(questionId, '');
    }

    onSubmit(): void {
        const responses: ClarificationResponse[] = [];
        const answersMap = this.answers();

        answersMap.forEach((answer, questionId) => {
            if (answer.trim().length > 0) {
                responses.push({
                    questionId,
                    answer: answer.trim()
                });
            }
        });

        this.close(responses);
    }

    onSkip(): void {
        this.close(null);
    }
}
