import { AssetSummary, AssetSummarySchema, AssetPricesResponseSchema, OHLCV, SimCreateResponse, SimCreateResponseSchema, RealTimeTick, RealTimeDataResponseSchema, RealTimeSymbolsResponseSchema, ChartBar, ChartInterval, ChartBarsResponseSchema, Mover, MoversResponseSchema } from '../types/assets';
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

export async function fetchRealTimeTicks(ticker: string): Promise<RealTimeTick[]>
{
  const symbol = ticker.toUpperCase();
  const res = await fetch(`${apiUrl}/real_time/points/${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error(`Failed to fetch real time data: ${res.status}`);
  const data = await res.json();
  return RealTimeDataResponseSchema.parse(data).points;
}

export async function fetchChartBars(
  ticker: string,
  interval: ChartInterval,
): Promise<ChartBar[]>
{
  const symbol = encodeURIComponent(ticker.toUpperCase());
  const res = await apiClient(`/assets/${symbol}/chart_predef?interval=${interval}`);
  return ChartBarsResponseSchema.parse(res);
}

export async function fetchTopMovers(limit: number = 10): Promise<Mover[]>
{
  const res = await fetch(`${apiUrl}/real_time/movers?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch top movers: ${res.status}`);
  const data = await res.json();
  return MoversResponseSchema.parse(data).movers;
}

export async function fetchRealTimeSymbols(): Promise<string[]>
{
  const res = await fetch(`${apiUrl}/real_time/list`);
  if (!res.ok) throw new Error(`Failed to fetch real time symbols: ${res.status}`);
  const data = await res.json();
  return RealTimeSymbolsResponseSchema.parse(data).symbols;
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
