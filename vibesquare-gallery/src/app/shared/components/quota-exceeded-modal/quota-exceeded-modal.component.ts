import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonComponent } from '../button/button.component';

export interface QuotaExceededModalData {
    tokensRequired?: number;
    tokensAvailable: number;
    resetDate: string;
    upgradeAvailable?: boolean;
}

@Component({
    selector: 'app-quota-exceeded-modal',
    standalone: true,
    imports: [CommonModule, ButtonComponent],
    templateUrl: './quota-exceeded-modal.component.html',
    styleUrls: ['./quota-exceeded-modal.component.css']
})
export class QuotaExceededModalComponent {
    private router = inject(Router);

    // These will be set by the modal service
    data!: QuotaExceededModalData;
    close!: (result?: 'upgrade' | 'wait') => void;

    get shortage(): number {
        if (!this.data.tokensRequired) return 0;
        return Math.max(0, this.data.tokensRequired - this.data.tokensAvailable);
    }

    get resetTimeString(): string {
        const now = new Date();
        const reset = new Date(this.data.resetDate);
        const diffMs = reset.getTime() - now.getTime();

        if (diffMs <= 0) return 'soon';

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
        }
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }

    get resetDateFormatted(): string {
        return new Date(this.data.resetDate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }

    formatNumber(num: number): string {
        return num.toLocaleString();
    }

    onUpgrade(): void {
        this.close('upgrade');
        this.router.navigate(['/subscription']);
    }

    onWait(): void {
        this.close('wait');
    }
}
