import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { NotificationResponse } from '../models/notification.model';
import { ApiService } from '../api.service';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    // Signal for unread count
    unreadCount = signal<number>(0);

    constructor(private apiService: ApiService) { }

    getNotifications(page = 1, limit = 20): Observable<NotificationResponse> {
        return this.apiService.get<NotificationResponse>('gallery/notifications', {
            params: { page: page.toString(), limit: limit.toString() }
        });
    }

    getUnreadCount(): Observable<any> {
        return this.apiService.get('gallery/notifications/unread-count').pipe(
            tap((res: any) => {
                if (res.success) {
                    this.unreadCount.set(res.data.count);
                }
            })
        );
    }

    markAsRead(id: string): Observable<any> {
        return this.apiService.patch(`gallery/notifications/${id}/read`, {}).pipe(
            tap(() => this.getUnreadCount().subscribe()) // Update count
        );
    }

    markAllAsRead(): Observable<any> {
        return this.apiService.patch('gallery/notifications/read-all', {}).pipe(
            tap(() => this.unreadCount.set(0))
        );
    }

    deleteNotification(id: string): Observable<any> {
        return this.apiService.delete(`gallery/notifications/${id}`);
    }
}
