import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Skip adding token for auth endpoints to avoid loops if needed, 
    // though usually harmless unless it's a refresh endpoint failing with bad token.
    // We should definitely skip if it's the refresh endpoint itself to prevent infinite loops.
    if (req.url.includes('/auth/refresh')) {
        return next(req);
    }

    const token = authService.getToken();
    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
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
                        // Refresh failed (logic usually handled in service tap/catch, but just in case)
                        authService.logout().subscribe(); // Perform cleanup
                        router.navigate(['/login']);
                        return throwError(() => error);
                    }),
                    catchError((refreshErr) => {
                        // Refresh token failed completely
                        authService.logout().subscribe();
                        router.navigate(['/login']);
                        return throwError(() => refreshErr);
                    })
                );
            }
            return throwError(() => error);
        })
    );
};
