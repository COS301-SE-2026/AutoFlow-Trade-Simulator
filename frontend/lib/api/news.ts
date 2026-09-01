import {apiClient} from '@/lib/api';
import {NewsResponseSchema} from '@/lib/types/news';

export async function fetchNews(ticker: string, startDate: Date, endDate: Date) {
    if (endDate.getTime() < startDate.getTime()) throw new Error('endDate must be after startDate');
    if (ticker.length === 0) throw new Error('Ticker cannot be empty');

    const response = await apiClient('/news', {
        method: 'POST',
        body: {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            ticker: ticker.toUpperCase(),
        },
    });

    const parsed = NewsResponseSchema.safeParse(response);

    if (!parsed.success) {
        console.error('News API response validation failed:');
        parsed.error.issues.forEach((issue) => {
            console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
        });

        throw new Error('Invalid news data received from API');
    }
    return parsed.data;
}