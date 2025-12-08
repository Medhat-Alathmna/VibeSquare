import { Framework, Category } from './project.model';

export interface FilterState {
  searchQuery: string;
  frameworks: Framework[];
  categories: Category[];
  tags: string[];
  sortBy: SortOption;
}

export type SortOption =
  | 'recent'
  | 'popular'
  | 'mostLiked'
  | 'mostDownloaded';

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}
