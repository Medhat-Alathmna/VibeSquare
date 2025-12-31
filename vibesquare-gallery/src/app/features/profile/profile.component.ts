import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';
import { UserProfileService } from '../../core/services/user-profile.service';
import { ProfileTab } from '../../core/models/user-profile.model';

// Subcomponents
import { ProfileHeaderComponent } from './components/profile-header/profile-header.component';
import { StatsTabComponent } from './components/stats-tab/stats-tab.component';
import { FavoritesTabComponent } from './components/favorites-tab/favorites-tab.component';
import { AnalysisHistoryTabComponent } from './components/analysis-history-tab/analysis-history-tab.component';
import { ActivityTabComponent } from './components/activity-tab/activity-tab.component';
import { SettingsTabComponent } from './components/settings-tab/settings-tab.component';

interface TabConfig {
  id: ProfileTab;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ProfileHeaderComponent,
    StatsTabComponent,
    FavoritesTabComponent,
    AnalysisHistoryTabComponent,
    ActivityTabComponent,
    SettingsTabComponent
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private userProfileService = inject(UserProfileService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  activeTab = signal<ProfileTab>('overview');

  tabs: TabConfig[] = [
    { id: 'overview', label: 'Overview', icon: 'chart-bar' },
    { id: 'favorites', label: 'Favorites', icon: 'heart' },
    { id: 'analyses', label: 'Analysis History', icon: 'clock' },
    { id: 'activity', label: 'Activity', icon: 'activity' },
    { id: 'settings', label: 'Settings', icon: 'cog' }
  ];

  ngOnInit(): void {
    // Load initial stats data
    this.userProfileService.getStats().subscribe();
  }

  setActiveTab(tabId: ProfileTab): void {
    this.activeTab.set(tabId);
  }

  getTabIcon(iconName: string): string {
    const icons: Record<string, string> = {
      'chart-bar': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      'heart': 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      'clock': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      'activity': 'M13 10V3L4 14h7v7l9-11h-7z',
      'cog': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
    };
    return icons[iconName] || '';
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.userProfileService.clearProfileState();
      this.router.navigate(['/explore']);
    });
  }
}
