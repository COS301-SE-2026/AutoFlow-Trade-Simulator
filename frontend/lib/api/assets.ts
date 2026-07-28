import { AssetSummary, AssetSummarySchema, AssetPricesResponseSchema, OHLCV, SimCreateResponse, SimCreateResponseSchema } from '../types/assets';
import { apiClient } from '@/lib/api'

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchAssetPrices(
  ticker: string,
  timeframe: string,
  count?: number,
): Promise<OHLCV[]> 
{
  let url = `${apiUrl}/market-data/assets/${encodeURIComponent(ticker)}/prices?timeframe=${timeframe}`;

  if (count !== undefined) {
    url += `&count=${count}`;
  }
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch prices: ${res.status}`);
  const data = await res.json();
  return AssetPricesResponseSchema.parse(data);
}

export async function startSimulation(
  symbols: string[],
  allocations: Record<string, number>,
  start_date: string,
  end_date: string,
  initial_balance: string
): Promise<SimCreateResponse>
{
  const res = await apiClient(`/simulation/practice/simulate`,
  {
    method: 'POST',
    body: {
      symbols,
      allocations,
      start_date,
      end_date,
      initial_balance,
    },
  });
  return SimCreateResponseSchema.parse(res);
}

export async function fetchAssetSummary(ticker: string): Promise<AssetSummary> 
{
  const res = await fetch(`${apiUrl}/market-data/assets/${encodeURIComponent(ticker)}/summary`);
  if (!res.ok) throw new Error(`Failed to fetch asset summary: ${res.status}`);
  const data = await res.json();
  return AssetSummarySchema.parse(data);
}
