export type NotificationType = 'subscription_expiring' | 'download_available' | 'system';

export interface GalleryNotification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    data?: any;
    createdAt: Date;
}

export interface NotificationResponse {
    success: boolean;
    message: string;
    data: {
        data: GalleryNotification[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
