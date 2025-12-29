// History Models - Based on Gallery Analysis History API

export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

// History item (list view - without full prompt)
export interface AnalysisHistoryItem {
  id: string;
  url: string;
  pageTitle?: string;
  pageDescription?: string;
  tokensUsed: number;
  status: AnalysisStatus;
  createdAt: string;
  completedAt?: string;
}

// Full analysis record (detail view - with prompt)
export interface IGalleryAnalysis {
  id: string;
  userId: string;
  url: string;
  prompt?: string;
  tokensUsed: number;
  status: AnalysisStatus;
  metadata: {
    model?: string;
    pageTitle?: string;
    pageDescription?: string;
    [key: string]: any;
  };
  pageTitle?: string;
  pageDescription?: string;
  screenshotUrl?: string;
  createdAt: string;
  completedAt?: string;
  deletedAt?: string;
}

// Paginated response wrapper
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Response types
export interface HistoryResponse {
  success: boolean;
  data: PaginatedResult<AnalysisHistoryItem>;
}

export interface RecentAnalysesResponse {
  success: boolean;
  data: AnalysisHistoryItem[];
}

export interface AnalysisDetailResponse {
  success: boolean;
  data: IGalleryAnalysis;
}

export interface DeleteAnalysisResponse {
  success: boolean;
  message: string;
}
