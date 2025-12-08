import { Routes } from '@angular/router';

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
    path: '**',
    redirectTo: '/explore'
  }
];
