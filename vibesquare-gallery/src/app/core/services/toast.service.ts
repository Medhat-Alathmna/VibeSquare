import { Injectable, signal } from '@angular/core';

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info' | 'loading';
    message: string;
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    toasts = signal<Toast[]>([]);

    private generateId(): string {
        return Math.random().toString(36).substring(2, 9);
    }

    show(message: string, type: Toast['type'] = 'info', duration = 5000): string {
        const id = this.generateId();
        const toast: Toast = { id, type, message, duration };

        this.toasts.update(current => [...current, toast]);

        if (duration > 0) {
            setTimeout(() => this.dismiss(id), duration);
        }

        return id;
    }

    success(message: string, duration = 5000): string {
        return this.show(message, 'success', duration);
    }

    error(message: string, duration = 5000): string {
        return this.show(message, 'error', duration);
    }

    warning(message: string, duration = 5000): string {
        return this.show(message, 'warning', duration);
    }

    info(message: string, duration = 5000): string {
        return this.show(message, 'info', duration);
    }

    /**
     * Show a loading toast with spinner (no auto-dismiss)
     * Returns the toast ID so it can be dismissed manually
     */
    loading(message: string): string {
        return this.show(message, 'loading', 0);
    }

    dismiss(id: string): void {
        this.toasts.update(current => current.filter(t => t.id !== id));
    }

    dismissAll(): void {
        this.toasts.set([]);
    }
}
