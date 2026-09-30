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
  Rumor: 'bg-[rgba(247,148,29,0.15)] text-[var(--orange)] border-[rgba(247,148,29,0.4)]',
  SENS: 'bg-[rgba(28,117,188,0.15)] text-blue-400 border-[rgba(28,117,188,0.4)]',
  Article: 'bg-gray-700/30 text-gray-300 border-gray-600/40',
  Ruling: 'bg-[rgba(0,148,68,0.15)] text-[var(--green)] border-[rgba(0,148,68,0.4)]',
};