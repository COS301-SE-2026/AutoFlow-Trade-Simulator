export type NewsCategory = 'Rumor' | 'SENS' | 'Article' | 'Ruling';

export interface NewsItem {
  id: string;
  timestamp: string;
  category: NewsCategory;
  description: string;
  source?: string;
  author?: string;
  fullStory?: string;
}

export const CATEGORY_STYLES: Record<NewsCategory, string> = {
  Rumor: 'bg-[var(--orange)]/15 text-[var(--orange)] border-[var(--orange)]/40',
  SENS: 'bg-[var(--blue)]/15 text-blue-400 border-[var(--blue)]/40',
  Article: 'bg-gray-700/30 text-gray-300 border-gray-600/40',
  Ruling: 'bg-[var(--green)]/15 text-[var(--green)] border-[var(--green)]/40',
};