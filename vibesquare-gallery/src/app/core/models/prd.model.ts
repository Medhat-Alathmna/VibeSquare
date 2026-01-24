// Pipeline Type options
export type PipelineType = 'visual' | 'technical' | 'both';

// Detail Level options
export type DetailLevel = 'basic' | 'detailed' | 'comprehensive';

// Pipeline Type dropdown options
export interface PipelineTypeOption {
  value: PipelineType;
  label: string;
  description: string;
  estimatedTime: string;
}

export const PIPELINE_TYPE_OPTIONS: PipelineTypeOption[] = [
  {
    value: 'visual',
    label: 'Visual Only',
    description: 'Design & frontend specs',
    estimatedTime: '15-25s'
  },
  {
    value: 'technical',
    label: 'Technical Only',
    description: 'Backend architecture',
    estimatedTime: '45-70s'
  },
  {
    value: 'both',
    label: 'Full PRD',
    description: 'Complete documentation',
    estimatedTime: '60-90s'
  }
];

// Detail Level dropdown options
export interface DetailLevelOption {
  value: DetailLevel;
  label: string;
  description: string;
  estimatedTime: string;
}

export const DETAIL_LEVEL_OPTIONS: DetailLevelOption[] = [
  {
    value: 'basic',
    label: 'Basic',
    description: 'Essential specs (70% coverage)',
    estimatedTime: '30-60s'
  },
  {
    value: 'detailed',
    label: 'Detailed',
    description: 'Production ready (80% coverage)',
    estimatedTime: '60-90s'
  },
  {
    value: 'comprehensive',
    label: 'Comprehensive',
    description: 'Enterprise grade (90% coverage)',
    estimatedTime: '90-150s'
  }
];

// V2.5 Analysis Request
export interface AnalysisV25Request {
  url: string;
  pipelineType: PipelineType;
  detailLevel: DetailLevel;
  tier?: 'free' | 'basic' | 'pro' | 'enterprise';
  includeDebug?: boolean;
}

// V2.5 PRD Metadata
export interface PrdMetadata {
  sourceUrl: string;
  pipelineType: PipelineType;
  detailLevel: DetailLevel;
  processingTimeMs: number;
  validationScore: number;
  qaIterations: number;
  qaApproved: boolean;
}

// V2.5 Analysis Result
export interface AnalysisV25Result {
  prdId: string;
  prdMarkdown: string;
  metadata: PrdMetadata;
}

// V2.5 Response wrapper
export interface AnalysisV25Response {
  success: boolean;
  statusCode: number;
  message?: string;
  data: AnalysisV25Result;
}

// PRD List Item (for history/list views)
export interface PrdListItem {
  id: string;
  sourceUrl: string;
  pipelineType: PipelineType;
  detailLevel: DetailLevel;
  validationScore: number;
  qaApproved: boolean;
  createdAt: string;
}

// PRD Full Detail (when viewing single PRD)
export interface PrdDetail extends PrdListItem {
  userId?: string;
  prdMarkdown: string;
  metadata?: PrdMetadata;
  visualAnalysis?: {
    finalPrompt: string;
    userQuestions: unknown[];
    metadata: Record<string, unknown>;
  };
  databaseSchema?: string;
  backendArchitecture?: string;
  securityRecommendations?: string;
  testingStrategy?: string;
  devopsConfig?: string;
  validationResult?: string;
  qaReview?: string;
  qaIterations?: number;
  updatedAt?: string;
}

// Pagination metadata
export interface PrdPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// PRD List Response
export interface PrdListResponse {
  success: boolean;
  statusCode: number;
  data: {
    prds: PrdListItem[];
    pagination: PrdPaginationMeta;
  };
  message?: string;
}

// PRD Detail Response
export interface PrdDetailResponse {
  success: boolean;
  statusCode: number;
  data: PrdDetail;
  message?: string;
}

// PRD Delete Response
export interface PrdDeleteResponse {
  success: boolean;
  statusCode: number;
  data: {
    deleted: boolean;
  };
  message?: string;
}

// PRD By URL Response
export interface PrdByUrlResponse {
  success: boolean;
  statusCode: number;
  data: PrdListItem[];
  message?: string;
}

// Helper function to get estimated time based on options
export function getEstimatedTime(pipelineType: PipelineType, detailLevel: DetailLevel): string {
  const pipelineTimes: Record<PipelineType, Record<DetailLevel, string>> = {
    visual: {
      basic: '10-15s',
      detailed: '15-25s',
      comprehensive: '25-40s'
    },
    technical: {
      basic: '30-45s',
      detailed: '45-70s',
      comprehensive: '70-120s'
    },
    both: {
      basic: '40-60s',
      detailed: '60-90s',
      comprehensive: '90-150s'
    }
  };
  return pipelineTimes[pipelineType][detailLevel];
}

// Helper function to get validation score color class
export function getValidationScoreColor(score: number): string {
  if (score >= 90) return 'text-green-400';
  if (score >= 70) return 'text-yellow-400';
  return 'text-red-400';
}

// Helper function to format pipeline type for display
export function formatPipelineType(type: PipelineType): string {
  const labels: Record<PipelineType, string> = {
    visual: 'Visual',
    technical: 'Technical',
    both: 'Full PRD'
  };
  return labels[type];
}

// Helper function to format detail level for display
export function formatDetailLevel(level: DetailLevel): string {
  const labels: Record<DetailLevel, string> = {
    basic: 'Basic',
    detailed: 'Detailed',
    comprehensive: 'Comprehensive'
  };
  return labels[level];
}
