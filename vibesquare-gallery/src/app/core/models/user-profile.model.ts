// User Profile Models
// Based on API: /api/gallery/users

// Profile Tab Type
export type ProfileTab = 'overview' | 'favorites' | 'analyses' | 'activity' | 'settings';

// ============================================
// User Stats (GET /api/gallery/users/me/stats)
// ============================================
export interface UserStats {
  totalFavorites: number;
  totalAnalyses: number;
  totalTokensUsed: number;
  tokensUsedThisWeek: number;
  analysisThisWeek: number;
  quotaLimit: number;
  quotaRemaining: number;
  quotaPeriodEnd: string;
  lastActiveAt: string;
  lastAnalysisAt: string;
  memberSince: string;
}

export interface UserStatsResponse {
  success: boolean;
  statusCode: number;
  data: UserStats;
  message: string;
}

// ============================================
// User Analysis Item (GET /api/gallery/users/me/analyses)
// ============================================
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface UserAnalysisItem {
  id: string;
  url: string;
  pageTitle: string | null;
  pageDescription: string | null;
  screenshotUrl: string | null;
  tokensUsed: number;
  status: AnalysisStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface UserAnalysesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserAnalysesData {
  data: UserAnalysisItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserAnalysesResponse {
  success: boolean;
  statusCode: number;
  data: UserAnalysesData;
  message: string;
}

// ============================================
// Activity Log (GET /api/gallery/users/me/activity)
// ============================================
export type ActivityAction =
  | 'login'
  | 'logout'
  | 'download'
  | 'favorite'
  | 'unfavorite'
  | 'view'
  | 'ai_use'
  | 'profile_update';

export interface ActivityLogItem {
  id: string;
  action: ActivityAction;
  resourceType: string | null;
  resourceId: string | null;
  description: string;
  createdAt: string;
}

export interface ActivityLogData {
  data: ActivityLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ActivityLogResponse {
  success: boolean;
  statusCode: number;
  data: ActivityLogData;
  message: string;
}

// ============================================
// Favorites (GET /api/gallery/users/:username/favorites)
// ============================================
export interface FavoriteProject {
  id: string;
  projectId: string;
  favoritedAt: string;
  project: {
    id: string;
    title: string;
    shortDescription: string;
    thumbnail: string;
    framework: string;
    category: string;
    tags: string[];
    likes: number;
    views: number;
  } | null;
}

export interface FavoritesData {
  data: FavoriteProject[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FavoritesResponse {
  success: boolean;
  statusCode: number;
  data: FavoritesData;
  message: string;
}
