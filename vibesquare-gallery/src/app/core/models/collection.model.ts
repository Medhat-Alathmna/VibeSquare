export interface Collection {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  projectIds: string[];
  tags: string[];
  createdAt: Date | string;
  featured: boolean;
}
