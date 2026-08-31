import { z } from 'zod';

const NewsCategoryEnum = z.enum(['RUMOR', 'SENS', 'ARTICLE', 'RULING']);

const NewsItemSchema = z.object({
  id: z.number().int(),
  timestamp: z.string().datetime(),
  category: NewsCategoryEnum,
  description: z.string(),
  source: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  full_story: z.string(),
});

const NewsResponseSchema = z.object({
  news_items: z.array(NewsItemSchema),
});

export type NewsItem = z.infer<typeof NewsItemSchema>;
export type NewsResponse = z.infer<typeof NewsResponseSchema>;