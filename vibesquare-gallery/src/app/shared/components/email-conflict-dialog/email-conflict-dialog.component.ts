import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface EmailConflictDialogData {
    message: string;
}

@Component({
    selector: 'app-email-conflict-dialog',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './email-conflict-dialog.component.html',
    styleUrls: ['./email-conflict-dialog.component.css']
})
export class EmailConflictDialogComponent {
    private router = inject(Router);

    data!: EmailConflictDialogData;
    close!: () => void;

    onSignIn(): void {
        this.close();
        this.router.navigate(['/auth/login']);
    }

    onCancel(): void {
        this.close();
    }
}
