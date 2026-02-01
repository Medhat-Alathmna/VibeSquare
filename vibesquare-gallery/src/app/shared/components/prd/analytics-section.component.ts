import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface KPI {
    name: string;
    target: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    description?: string;
}

export interface TrackingEvent {
    name: string;
    description: string;
    properties?: Array<{ name: string; type: string }>;
}

export interface AnalyticsData {
    kpis: KPI[];
    trackingEvents: TrackingEvent[];
}

@Component({
    selector: 'app-analytics-section',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="bg-dark-surface border border-dark-border rounded-xl p-5">
            <!-- Header -->
            <div class="flex items-center gap-2 mb-4">
                <span class="text-lg">📊</span>
                <h3 class="text-lg font-display font-bold text-white">Analytics & KPIs</h3>
            </div>

            @if (analytics(); as data) {
                <!-- KPIs Table -->
                @if (data.kpis && data.kpis.length > 0) {
                    <div class="mb-6">
                        <h4 class="text-sm font-medium text-gray-400 mb-3">Key Performance Indicators</h4>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="border-b border-dark-border">
                                        <th class="text-left py-2 px-3 text-gray-400 font-medium">KPI</th>
                                        <th class="text-left py-2 px-3 text-gray-400 font-medium">Target</th>
                                        <th class="text-left py-2 px-3 text-gray-400 font-medium">Frequency</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for (kpi of data.kpis; track kpi.name) {
                                        <tr class="border-b border-dark-border/50 hover:bg-dark-bg/50">
                                            <td class="py-2 px-3 text-white">{{ kpi.name }}</td>
                                            <td class="py-2 px-3 text-secondary font-medium">{{ kpi.target }}</td>
                                            <td class="py-2 px-3">
                                                <span class="px-2 py-0.5 rounded text-xs"
                                                    [class]="getFrequencyClass(kpi.frequency)">
                                                    {{ kpi.frequency | titlecase }}
                                                </span>
                                            </td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                }

                <!-- Tracking Events -->
                @if (data.trackingEvents && data.trackingEvents.length > 0) {
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="text-sm font-medium text-gray-400">
                                Tracking Events ({{ data.trackingEvents.length }})
                            </h4>
                        </div>

                        <div class="space-y-2">
                            @for (event of data.trackingEvents; track event.name) {
                                <div class="p-3 bg-dark-bg rounded-lg border border-dark-border/50">
                                    <div class="flex items-center justify-between">
                                        <code class="text-secondary text-sm font-mono">{{ event.name }}</code>
                                        @if (event.properties && event.properties.length > 0) {
                                            <button
                                                (click)="toggleEventProperties(event.name)"
                                                class="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                                                <span>{{ event.properties.length }} properties</span>
                                                <svg class="w-3 h-3 transition-transform"
                                                    [class.rotate-180]="expandedEvents()[event.name]"
                                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                        }
                                    </div>
                                    <p class="text-xs text-gray-500 mt-1">{{ event.description }}</p>

                                    <!-- Properties -->
                                    @if (expandedEvents()[event.name] && event.properties) {
                                        <div class="mt-3 pt-3 border-t border-dark-border/50">
                                            <div class="grid grid-cols-2 gap-2">
                                                @for (prop of event.properties; track prop.name) {
                                                    <div class="flex items-center gap-2 text-xs">
                                                        <code class="text-gray-400">{{ prop.name }}</code>
                                                        <span class="text-gray-600">:</span>
                                                        <span class="text-blue-400">{{ prop.type }}</span>
                                                    </div>
                                                }
                                            </div>
                                        </div>
                                    }
                                </div>
                            }
                        </div>
                    </div>
                }
            } @else {
                <!-- No Data State -->
                <div class="text-center py-8 text-gray-500">
                    <span class="text-2xl mb-2 block">📊</span>
                    <p>Analytics data not available</p>
                </div>
            }
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }
    `]
})
export class AnalyticsSectionComponent {
    analytics = input<AnalyticsData | null>(null);

    expandedEvents = signal<Record<string, boolean>>({});

    toggleEventProperties(eventName: string): void {
        this.expandedEvents.update(state => ({
            ...state,
            [eventName]: !state[eventName]
        }));
    }

    getFrequencyClass(frequency: string): string {
        const classes: Record<string, string> = {
            daily: 'bg-blue-500/20 text-blue-400',
            weekly: 'bg-purple-500/20 text-purple-400',
            monthly: 'bg-green-500/20 text-green-400'
        };
        return classes[frequency] || 'bg-gray-500/20 text-gray-400';
    }
}
