import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // If user is authenticated, redirect to explore page
    if (authService.isAuthenticated()) {
        console.log('[Guest Guard] User is authenticated, redirecting to /explore');
        router.navigate(['/explore']);
        return false;
    }

    // User is not authenticated, allow access to auth pages
    return true;
};
