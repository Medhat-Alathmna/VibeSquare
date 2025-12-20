import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_CONFIG } from '../constants/api.constants';
import { NotificationResponse } from '../models/notification.model';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = `${API_CONFIG.baseUrl}/notifications`;

    // Signal for unread count
    unreadCount = signal<number>(0);

    constructor(private http: HttpClient) { }

    getNotifications(page = 1, limit = 20): Observable<NotificationResponse> {
        return this.http.get<NotificationResponse>(this.apiUrl, {
            params: { page, limit }
        });
    }

    getUnreadCount(): Observable<any> {
        return this.http.get(`${this.apiUrl}/unread-count`).pipe(
            tap((res: any) => {
                if (res.success) {
                    this.unreadCount.set(res.data.count);
                }
            })
        );
    }

    markAsRead(id: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/read`, {}).pipe(
            tap(() => this.getUnreadCount().subscribe()) // Update count
        );
    }

    markAllAsRead(): Observable<any> {
        return this.http.patch(`${this.apiUrl}/read-all`, {}).pipe(
            tap(() => this.unreadCount.set(0))
        );
    }

    deleteNotification(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
