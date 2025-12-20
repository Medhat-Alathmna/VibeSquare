import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { GalleryNotification } from '../../../core/models/notification.model';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-notifications-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './notifications-list.component.html',
    styles: []
})
export class NotificationsListComponent implements OnInit {
    private notificationService = inject(NotificationService);

    notifications = signal<GalleryNotification[]>([]);
    isLoading = false;

    ngOnInit() {
        this.loadNotifications();
    }

    loadNotifications() {
        this.isLoading = true;
        this.notificationService.getNotifications().subscribe(res => {
            if (res.success) {
                this.notifications.set(res.data.data);
            }
            this.isLoading = false;
        });
    }

    markAsRead(id: string) {
        this.notificationService.markAsRead(id).subscribe(() => {
            this.notifications.update(list =>
                list.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
        });
    }

    markAllRead() {
        this.notificationService.markAllAsRead().subscribe(() => {
            this.notifications.update(list =>
                list.map(n => ({ ...n, isRead: true }))
            );
        });
    }

    deleteNotification(id: string) {
        this.notificationService.deleteNotification(id).subscribe(() => {
            this.notifications.update(list => list.filter(n => n.id !== id));
        });
    }
}
