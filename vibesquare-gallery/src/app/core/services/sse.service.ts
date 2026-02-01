import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PrdService } from './prd.service';
import {
    PipelineUpdate,
    AgentConfidence,
    getConfidenceLevel
} from '../models/prd.model';

export type SSEConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';

@Injectable({
    providedIn: 'root'
})
export class SseService implements OnDestroy {
    private prdService = inject(PrdService);

    // Connection state
    private connectionStateSignal = signal<SSEConnectionState>('disconnected');
    private eventSource: EventSource | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000; // Start with 1 second
    private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;

    // Subjects for event streaming
    private updateSubject = new Subject<PipelineUpdate>();
    private errorSubject = new Subject<string>();

    // Public readonly
    readonly connectionState = this.connectionStateSignal.asReadonly();
    readonly updates$ = this.updateSubject.asObservable();
    readonly errors$ = this.errorSubject.asObservable();

    ngOnDestroy(): void {
        this.disconnect();
    }

    /**
     * Connect to SSE stream for pipeline updates
     */
    streamPipelineUpdates(jobId: string): Observable<PipelineUpdate> {
        // Disconnect any existing connection
        this.disconnect();

        return new Observable<PipelineUpdate>(observer => {
            this.connectionStateSignal.set('connecting');
            this.reconnectAttempts = 0;

            const connect = () => {
                const url = `${environment.apiUrl}/analyze/v25/stream/${jobId}`;

                try {
                    this.eventSource = new EventSource(url, { withCredentials: true });

                    this.eventSource.onopen = () => {
                        this.connectionStateSignal.set('connected');
                        this.reconnectAttempts = 0;
                        this.reconnectDelay = 1000;
                    };

                    this.eventSource.onmessage = (event) => {
                        try {
                            const update: PipelineUpdate = JSON.parse(event.data);
                            this.handleUpdate(update);
                            observer.next(update);
                            this.updateSubject.next(update);

                            // Close connection on completion or error
                            if (update.type === 'completed' || update.type === 'error') {
                                this.disconnect();
                                observer.complete();
                            }
                        } catch (e) {
                            console.error('Failed to parse SSE message:', e);
                        }
                    };

                    this.eventSource.onerror = (error) => {
                        console.error('SSE error:', error);

                        if (this.eventSource?.readyState === EventSource.CLOSED) {
                            // Connection was closed, attempt reconnect
                            this.attemptReconnect(connect, observer);
                        } else {
                            this.connectionStateSignal.set('error');
                            this.errorSubject.next('SSE connection error');
                        }
                    };

                    // Listen for specific event types
                    this.eventSource.addEventListener('agent_started', (event: MessageEvent) => {
                        const update = this.parseEvent(event, 'agent_started');
                        if (update) {
                            observer.next(update);
                            this.updateSubject.next(update);
                        }
                    });

                    this.eventSource.addEventListener('agent_completed', (event: MessageEvent) => {
                        const update = this.parseEvent(event, 'agent_completed');
                        if (update) {
                            observer.next(update);
                            this.updateSubject.next(update);
                        }
                    });

                    this.eventSource.addEventListener('needs_clarification', (event: MessageEvent) => {
                        const update = this.parseEvent(event, 'needs_clarification');
                        if (update) {
                            observer.next(update);
                            this.updateSubject.next(update);
                            // Don't close - wait for user input
                        }
                    });

                    this.eventSource.addEventListener('fallback_required', (event: MessageEvent) => {
                        const update = this.parseEvent(event, 'fallback_required');
                        if (update) {
                            observer.next(update);
                            this.updateSubject.next(update);
                            // Don't close - wait for user approval
                        }
                    });

                } catch (e) {
                    this.connectionStateSignal.set('error');
                    observer.error(e);
                }
            };

            connect();

            // Cleanup on unsubscribe
            return () => {
                this.disconnect();
            };
        });
    }

    /**
     * Disconnect from SSE stream
     */
    disconnect(): void {
        if (this.reconnectTimeoutId) {
            clearTimeout(this.reconnectTimeoutId);
            this.reconnectTimeoutId = null;
        }

        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }

        this.connectionStateSignal.set('disconnected');
    }

    /**
     * Check if currently connected
     */
    isConnected(): boolean {
        return this.eventSource?.readyState === EventSource.OPEN;
    }

    /**
     * Handle pipeline update and sync with PrdService
     */
    private handleUpdate(update: PipelineUpdate): void {
        switch (update.type) {
            case 'agent_started':
                if (update.agentName) {
                    this.prdService.updateCurrentAgent(update.agentName);
                }
                break;

            case 'agent_completed':
                if (update.agentConfidence) {
                    this.prdService.addCompletedAgent(update.agentConfidence);
                }
                this.prdService.updateCurrentAgent(null);
                break;

            case 'confidence_update':
                if (update.confidence) {
                    this.prdService.updateConfidence(update.confidence);
                }
                break;

            case 'needs_clarification':
                if (update.questions) {
                    this.prdService.setClarificationQuestions(update.questions);
                }
                break;

            case 'fallback_required':
                if (update.fallbackRequest) {
                    this.prdService.setFallbackRequest(update.fallbackRequest);
                }
                break;

            case 'completed':
                // PrdService will handle completion through the main response
                break;

            case 'error':
                // Error handling is done in the main flow
                break;
        }
    }

    /**
     * Parse SSE event data
     */
    private parseEvent(event: MessageEvent, type: PipelineUpdate['type']): PipelineUpdate | null {
        try {
            const data = JSON.parse(event.data);
            return {
                type,
                ...data,
                timestamp: data.timestamp || new Date().toISOString()
            };
        } catch (e) {
            console.error('Failed to parse SSE event:', e);
            return null;
        }
    }

    /**
     * Attempt to reconnect with exponential backoff
     */
    private attemptReconnect(
        connectFn: () => void,
        observer: { next: (value: PipelineUpdate) => void; error: (err: unknown) => void; complete: () => void }
    ): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.connectionStateSignal.set('error');
            this.errorSubject.next('Max reconnection attempts reached');
            observer.error(new Error('Max reconnection attempts reached'));
            return;
        }

        this.connectionStateSignal.set('reconnecting');
        this.reconnectAttempts++;

        // Exponential backoff with jitter
        const jitter = Math.random() * 1000;
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) + jitter, 30000);

        console.log(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

        this.reconnectTimeoutId = setTimeout(() => {
            if (this.eventSource) {
                this.eventSource.close();
                this.eventSource = null;
            }
            connectFn();
        }, delay);
    }

    /**
     * Create a mock update for testing (development only)
     */
    createMockUpdate(type: PipelineUpdate['type'], data: Partial<PipelineUpdate> = {}): PipelineUpdate {
        const baseUpdate: PipelineUpdate = {
            type,
            timestamp: new Date().toISOString(),
            ...data
        };

        if (type === 'agent_completed' && data.agentName && data.agentConfidence === undefined) {
            const score = Math.floor(Math.random() * 30) + 70; // 70-100
            baseUpdate.agentConfidence = {
                name: data.agentName,
                displayName: data.agentName,
                score,
                level: getConfidenceLevel(score),
                completedAt: new Date().toISOString()
            };
        }

        return baseUpdate;
    }
}
