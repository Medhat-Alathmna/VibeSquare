export interface Project {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  screenshots: string[];
  demoUrl?: string;
  downloadUrl?: string;

  // Prompt information
  prompt: Prompt;

  // Metadata
  framework: Framework;
  tags: string[];
  styles: string[];
  category: Category;

  // Stats
  likes: number;
  views: number;
  downloads: number;

  // Dates
  createdAt: Date | string;
  updatedAt: Date | string;

  // Collections this project belongs to
  collectionIds: string[];

  // Code files
  codeFiles?: CodeFile[];
}

export interface Prompt {
  text: string;
  model: string; // e.g., "Claude Sonnet 4.5"
  version?: string;
  parameters?: Record<string, any>;
}

export interface CodeFile {
  filename: string;
  language: string;
  content: string;
  path?: string;
}

export type Framework =
  | 'Angular'
  | 'React'
  | 'Vue'
  | 'Svelte'
  | 'Next.js'
  | 'Nuxt.js'
  | 'Vanilla';

export type Category =
  | 'Dashboard'
  | 'Landing Page'
  | 'E-commerce'
  | 'Portfolio'
  | 'Blog'
  | 'Admin Panel'
  | 'SaaS'
  | 'Other';
