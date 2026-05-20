import { AssetSummary, AssetSummarySchema, AssetPricesResponseSchema, OHLCV, OHLCVSchema } from '../types/assets';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchAssetPrices(ticker: string, timeframe: string): Promise<OHLCV[]> 
{
  const res = await fetch(`${apiUrl}/market-data/assets/${encodeURIComponent(ticker)}/prices?timeframe=${timeframe}`);
  if (!res.ok) throw new Error(`Failed to fetch prices: ${res.status}`);
  const data = await res.json();
  return AssetPricesResponseSchema.parse(data);
}

export async function fetchAssetSummary(ticker: string): Promise<AssetSummary> 
{
  const res = await fetch(`${apiUrl}/market-data/assets/${encodeURIComponent(ticker)}/summary`);
  if (!res.ok) throw new Error(`Failed to fetch asset summary: ${res.status}`);
  const data = await res.json();
  return AssetSummarySchema.parse(data);
}
