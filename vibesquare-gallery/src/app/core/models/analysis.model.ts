// Analysis Models
import { LlmType } from './llm.model';

export interface AnalysisEstimateRequest {
  url: string;
}

export interface AnalysisEstimate {
  url: string;
  estimatedTokens: number;
  quota: {
    remaining: number;
    sufficient: boolean;
    afterDeduction?: number;
    shortage?: number;
  };
  message: string;
}

export interface AnalysisEstimateResponse {
  success: boolean;
  message?: string;
  data: AnalysisEstimate;
}

export interface AnalysisConfirmRequest {
  url: string;
  options?: {
    includeAssets?: boolean;
    maxDepth?: number;
  };
}

export interface AnalysisResultMetadata {
  sourceUrl: string;
  nodesFound: number;
  layoutType: string;
  difficulty: string;
  language: string;
  processingTimeMs: number;
}

export interface AnalysisResult {
  prompt: string;
  metadata: AnalysisResultMetadata;
  processingTimeMs: number;
  analysisId: string;
  tokensUsed: number;
  quota: {
    remaining: number;
    limit: number;
  };
}

export interface AnalysisConfirmResponse {
  success: boolean;
  message?: string;
  data: AnalysisResult;
}

// Analysis state for UI
export type AnalysisState = 'idle' | 'estimating' | 'confirming' | 'analyzing' | 'completed' | 'error';

// Error response for quota exceeded (402)
export interface QuotaExceededError {
  success: false;
  statusCode: 402;
  message: string;
  data: {
    errorCode: 'QUOTA_EXCEEDED';
    quota: {
      limit: number;
      used: number;
      remaining: number;
      resetAt: string;
    };
    upgrade: {
      available: boolean;
      tier: string;
      limit: number;
    };
  };
}
