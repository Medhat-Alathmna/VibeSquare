import { Project, Framework, Category } from './project.model';

// Generic API Response wrapper
export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success?: boolean;
}

// Pagination metadata from API
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// Projects list response data
export interface ProjectsListData {
  projects: Project[];
  pagination: PaginationMeta;
}

// Builder info
export interface Builder {
  userId?: string;
  name: string;
  avatarUrl?: string;
}

// Builder social links
export interface BuilderSocialLinks {
  github?: string;
  twitter?: string;
  linkedin?: string;
  portfolio?: string;
}

// Extended project with builder info (from API)
export interface ProjectWithBuilder extends Project {
  builder?: Builder;
  builderSocialLinks?: BuilderSocialLinks;
}

// Query parameters for projects list
export interface ProjectsQueryParams {
  page?: number;
  limit?: number;
  framework?: Framework | string;
  category?: Category | string;
  tags?: string;
  sortBy?: 'recent' | 'popular' | 'mostLiked' | 'mostDownloaded';
}

// Query parameters for search
export interface ProjectSearchParams {
  q: string;
  frameworks?: string;
  categories?: string;
  tags?: string;
  sortBy?: 'recent' | 'popular' | 'mostLiked' | 'mostDownloaded';
  page?: number;
  limit?: number;
}

// View/Like/Download action response
export interface ProjectActionResponse {
  statusCode: number;
  data: {
    views?: number;
    likes?: number;
    downloads?: number;
  };
  message: string;
}
