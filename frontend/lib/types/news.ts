import { z } from 'zod';

const NewsCategoryEnum = z.enum(['Rumor', 'Sens', 'Article', 'Ruling']);

const NewsItemSchema = z.object({
  id: z.number().int(),
  timestamp: z.coerce.date(),
  category: NewsCategoryEnum,
  description: z.string(),
  source: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  full_story: z.string(),
});

export const NewsResponseSchema = z.object({
  news_items: z.array(NewsItemSchema),
});

export type NewsItem = z.infer<typeof NewsItemSchema>;
export type NewsResponse = z.infer<typeof NewsResponseSchema>;