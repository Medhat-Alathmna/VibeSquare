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

// API Style options
export type ApiStyle = 'REST' | 'GraphQL' | 'REST_GraphQL';

// V2.5 Analysis Request
export interface AnalysisV25Request {
  url: string;
  pipelineType: PipelineType;
  detailLevel: DetailLevel;
  tier?: 'free' | 'basic' | 'pro' | 'enterprise';
  includeDebug?: boolean;
  apiStyle?: ApiStyle;
  clarificationResponses?: PreflightClarificationResponse[];
  forceRefresh?: boolean;
}

// ============================================
// V2.5 Preflight Types
// ============================================

export interface PreflightRequest {
  url: string;
  tier?: string;
  forceRefresh?: boolean;
}

export interface PreflightQuestionOption {
  value: string;
  label: string;
  description?: string;
  isRecommended?: boolean;
  recommendationReason?: string;
}

export interface PreflightQuestion {
  id: string;
  question: string;
  context: string;
  agentName: string;
  allowMultiple: boolean;
  allowCustom: boolean;
  priority: 'critical' | 'important' | 'optional';
  options: PreflightQuestionOption[];
}

export interface PreflightVisualSummary {
  componentsDetected: string[];
  hasAuth: boolean;
  hasEcommerce: boolean;
  hasDashboard: boolean;
  hasSocial: boolean;
  hasContent: boolean;
  layoutType: string;
  sourceUrl: string;
}

export interface PreflightMetadata {
  sourceUrl: string;
  processingTimeMs: number;
  cached: boolean;
}

export interface PreflightData {
  questions: PreflightQuestion[];
  visualSummary: PreflightVisualSummary;
  metadata: PreflightMetadata;
}

export interface PreflightResponse {
  success: boolean;
  statusCode?: number;
  data: PreflightData;
  message?: string;
}

export interface PreflightClarificationResponse {
  questionId: string;
  selectedValues: string[];
  customAnswer?: string;
}

export type PreflightState = 'idle' | 'loading' | 'completed' | 'error';

// V2.5 PRD Metadata
export interface PrdMetadata {
  sourceUrl: string;
  pipelineType: PipelineType;
  detailLevel: DetailLevel;
  processingTimeMs: number;
  validationScore: number;
  qaIterations: number;
  qaApproved: boolean;
  cached?: boolean;        // Whether result was from cache
  cachedAt?: Date;         // When the cached result was originally created
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

// PRD Cache Check Response
export interface PrdCacheCheckResponse {
  success: boolean;
  statusCode: number;
  data: {
    cached: boolean;
    id?: string;         // PRD ID if cached
    sourceUrl?: string;  // Source URL if cached
    createdAt?: string;  // ISO date string if cached
  };
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

// ============================================
// V2.5 Confidence & Clarification Types
// ============================================

// Confidence level type
export type ConfidenceLevel = 'high' | 'medium' | 'low';

// Agent confidence data
export interface AgentConfidence {
  name: string;
  displayName: string;
  score: number;
  level: ConfidenceLevel;
  lowConfidenceAreas?: string[];
  completedAt?: string;
}

// Overall confidence data from pipeline
export interface ConfidenceData {
  overallScore: number;
  overallLevel: ConfidenceLevel;
  agentScores: Record<string, number>;
  agentConfidences: AgentConfidence[];
  lowConfidenceAreas: string[];
  clarificationNeeded: boolean;
}

// Analysis status types (extended for V2.5)
export type AnalysisStatus =
  | 'idle'
  | 'running'
  | 'completed'
  | 'fallback_required'
  | 'error';

// Model fallback request from backend
export interface FallbackRequest {
  agentName: string;
  failureReason: string;
  currentModel: string;
  proposedModel: string;
  estimatedCost: {
    current: number;
    proposed: number;
  };
  resumeToken: string;
}

// Pipeline update event (for SSE streaming)
export interface PipelineUpdate {
  type: 'agent_started' | 'agent_completed' | 'confidence_update' | 'fallback_required' | 'completed' | 'error';
  agentName?: string;
  progress?: number;
  confidence?: Partial<ConfidenceData>;
  agentConfidence?: AgentConfidence;
  fallbackRequest?: FallbackRequest;
  resumeToken?: string;
  result?: AnalysisV25Result;
  error?: string;
  timestamp: string;
}

// Extended V2.5 Response with new status types
export interface AnalysisV25StreamResponse {
  status: AnalysisStatus;
  jobId: string;
  confidence?: ConfidenceData;
  fallbackRequest?: FallbackRequest;
  resumeToken?: string;
  result?: AnalysisV25Result;
  error?: string;
}

// Approve fallback request body
export interface ApproveFallbackRequest {
  resumeToken: string;
  approved: boolean;
  targetModel?: string;
}

// ============================================
// V2.5 Helper Functions
// ============================================

// Get confidence level from score
export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 80) return 'high';
  if (score >= 70) return 'medium';
  return 'low';
}

// Get confidence badge color class
export function getConfidenceBadgeColor(level: ConfidenceLevel): string {
  const colors: Record<ConfidenceLevel, string> = {
    high: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-red-500/20 text-red-400 border-red-500/30'
  };
  return colors[level];
}

// Get confidence icon
export function getConfidenceIcon(level: ConfidenceLevel): string {
  const icons: Record<ConfidenceLevel, string> = {
    high: '🟢',
    medium: '🟡',
    low: '🔴'
  };
  return icons[level];
}

// Get confidence label
export function getConfidenceLabel(level: ConfidenceLevel): string {
  const labels: Record<ConfidenceLevel, string> = {
    high: 'High Confidence',
    medium: 'Medium Confidence',
    low: 'Low Confidence'
  };
  return labels[level];
}

// Format agent name for display
export function formatAgentName(name: string): string {
  const names: Record<string, string> = {
    identity: 'Identity Agent',
    database: 'Database Agent',
    backend: 'Backend Agent',
    testing: 'Testing Agent',
    devops: 'DevOps Agent',
    userStory: 'User Story Agent',
    prdValidator: 'PRD Validator',
    qa: 'QA Agent'
  };
  return names[name] || name;
}

// Calculate cost difference ratio
export function calculateCostRatio(current: number, proposed: number): number {
  if (current === 0) return proposed > 0 ? Infinity : 1;
  return Math.round(proposed / current);
}

// ============================================
// V2.5 Roadmap Types
// ============================================

// Roadmap phase type
export type RoadmapPhase = 'mvp' | 'v2' | 'v3' | 'future';

// Single roadmap item (story/feature)
export interface RoadmapItem {
  id: string;
  title: string;
  description?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'planned' | 'in_progress' | 'completed';
  storyPoints?: number;
}

// Roadmap milestone (phase)
export interface RoadmapMilestone {
  phase: RoadmapPhase;
  name: string;
  description?: string;
  targetDate?: string;
  items: RoadmapItem[];
  completedCount: number;
  totalCount: number;
}

// Full roadmap data
export interface RoadmapData {
  milestones: RoadmapMilestone[];
  totalStories: number;
  completedStories: number;
}

// Get phase display name
export function getPhaseDisplayName(phase: RoadmapPhase): string {
  const names: Record<RoadmapPhase, string> = {
    mvp: 'MVP',
    v2: 'Version 2.0',
    v3: 'Version 3.0',
    future: 'Future'
  };
  return names[phase];
}

// Get phase color class
export function getPhaseColorClass(phase: RoadmapPhase): string {
  const colors: Record<RoadmapPhase, string> = {
    mvp: 'bg-green-500',
    v2: 'bg-blue-500',
    v3: 'bg-purple-500',
    future: 'bg-gray-500'
  };
  return colors[phase];
}

// Get priority badge class
export function getPriorityBadgeClass(priority: RoadmapItem['priority']): string {
  const classes: Record<RoadmapItem['priority'], string> = {
    critical: 'bg-red-500/20 text-red-400',
    high: 'bg-orange-500/20 text-orange-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-gray-500/20 text-gray-400'
  };
  return classes[priority];
}

// ============================================
// Cache Status Helpers
// ============================================

export type CacheStatus = 'cached' | 'fresh';

// Get cache badge info
export interface CacheBadgeInfo {
  status: CacheStatus;
  icon: string;
  label: string;
  colorClass: string;
  tooltipText: string;
}

export function getCacheBadgeInfo(cached: boolean): CacheBadgeInfo {
  if (cached) {
    return {
      status: 'cached',
      icon: '⚡',
      label: 'Cached Result',
      colorClass: 'bg-green-500/20 text-green-400 border-green-500/30',
      tooltipText: 'This analysis was performed earlier and retrieved from cache for instant results'
    };
  } else {
    return {
      status: 'fresh',
      icon: '🔄',
      label: 'Fresh Analysis',
      colorClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      tooltipText: 'This is a newly executed analysis with the latest data'
    };
  }
}
