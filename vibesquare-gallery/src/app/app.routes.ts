import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/explore',
    pathMatch: 'full'
  },
  {
    path: 'explore',
    loadComponent: () =>
      import('./features/explore/explore.component').then(m => m.ExploreComponent),
    title: 'Explore - VibeSquare Gallery'
  },
  {
    path: 'project/:id',
    loadComponent: () =>
      import('./features/project-details/project-details.component').then(m => m.ProjectDetailsComponent),
    title: 'Project Details - VibeSquare Gallery'
  },
  {
    path: 'collections',
    loadComponent: () =>
      import('./features/collections/collections.component').then(m => m.CollectionsComponent),
    title: 'Collections - VibeSquare Gallery'
  },
  {
    path: 'collections/:id',
    loadComponent: () =>
      import('./features/collections/collection-details/collection-details.component').then(m => m.CollectionDetailsComponent),
    title: 'Collection Details - VibeSquare Gallery'
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./features/about/about.component').then(m => m.AboutComponent),
    title: 'About - VibeSquare Gallery'
  },
  {
    path: 'auth',
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent), title: 'Login - VibeSquare Gallery' },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent), title: 'Register - VibeSquare Gallery' },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent), title: 'Forgot Password - VibeSquare Gallery' },
      { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent), title: 'Reset Password - VibeSquare Gallery' },
      { path: 'verify-email', loadComponent: () => import('./features/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent), title: 'Verify Email - VibeSquare Gallery' },
      { path: 'callback', loadComponent: () => import('./features/auth/oauth-callback/oauth-callback.component').then(m => m.OAuthCallbackComponent), title: 'Signing In - VibeSquare Gallery' },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
    title: 'Profile - VibeSquare Gallery'
  },
  {
    path: 'notifications',
    loadComponent: () => import('./features/notifications/notifications-list/notifications-list.component').then(m => m.NotificationsListComponent),
    canActivate: [authGuard],
    title: 'Notifications - VibeSquare Gallery'
  },
  {
    path: '**',
    redirectTo: '/explore'
  }
];
