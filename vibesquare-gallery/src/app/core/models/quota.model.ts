// Token Quota Models

export type SubscriptionTier = 'free' | 'pro';

export interface TokenQuota {
  tier: SubscriptionTier;
  quota: {
    limit: number;
    used: number;
    remaining: number;
    periodStart: string;
    periodEnd: string;
  };
  analysisCount: number;
  lastAnalysisAt: string | null;
}

export interface TokenTransaction {
  id: string;
  type: 'analysis' | 'reset' | 'bonus';
  tokensAmount: number;
  tokensBefore: number;
  tokensAfter: number;
  analysisUrl?: string;
  description: string;
  createdAt: string;
}

// API Response Types
export interface QuotaResponse {
  success: boolean;
  data: TokenQuota;
}

export interface QuotaHistoryResponse {
  success: boolean;
  data: {
    data: TokenTransaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface QuotaCheckRequest {
  estimatedTokens: number;
}

export interface QuotaCheckResponse {
  success: boolean;
  data: {
    sufficient: boolean;
    remaining: number;
    afterDeduction?: number;
    required?: number;
    shortage?: number;
  };
}
