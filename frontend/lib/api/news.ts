import {apiClient} from "@/lib/api";
import { NewsResponseSchema } from "@/lib/types/news"

export async function fetchNews(ticker:string, startDate:Date, endDate:Date){
    if(endDate.getTime()<startDate.getTime()) throw new Error("endDate must be after startDate");
    if(ticker.length==0) throw new Error("Ticker cannot be empty");
    const params = new URLSearchParams({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        ticker: ticker.toUpperCase()
    });
    const response = await apiClient(`/news${params.toString()}`);
    return NewsResponseSchema.parse(response);
}