import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

// Auth endpoints that should NOT trigger token refresh on 401
const AUTH_ENDPOINTS = [
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email'
];

const isAuthEndpoint = (url: string): boolean => {
    return AUTH_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Always include credentials for cookies (refresh token)
    req = req.clone({
        withCredentials: true
    });

    // Skip adding token for refresh endpoint to prevent infinite loops
    if (req.url.includes('/auth/refresh')) {
        return next(req);
    }

    const token = authService.getToken();
    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            },
            withCredentials: true
        });
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Only attempt token refresh for 401 errors on NON-auth endpoints
            if (error.status === 401 && !isAuthEndpoint(req.url)) {
                // Try to refresh token
                return authService.refreshToken().pipe(
                    switchMap((response) => {
                        if (response.success) {
                            // Retry original request with new token
                            const newToken = response.data.accessToken;
                            const newReq = req.clone({
                                setHeaders: {
                                    Authorization: `Bearer ${newToken}`
                                }
                            });
                            return next(newReq);
                        }
                        // Refresh failed
                        authService.logout().subscribe();
                        router.navigate(['/auth/login']);
                        return throwError(() => error);
                    }),
                    catchError((refreshErr) => {
                        // Refresh token failed completely
                        authService.logout().subscribe();
                        router.navigate(['/auth/login']);
                        return throwError(() => refreshErr);
                    })
                );
            }
            // For auth endpoints or non-401 errors, just pass through the error
            return throwError(() => error);
        })
    );
};
