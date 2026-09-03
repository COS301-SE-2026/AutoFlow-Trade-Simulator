import { z } from 'zod';

export const OHLCVSchema = z.object({
  timestamp: z.string(),
  symbol: z.string(),
  interval: z.string(),
  open: z.number().positive(),
  high: z.number().positive(),
  low: z.number().positive(),
  close: z.number().positive(),
  volume: z.number().nonnegative(),
});

export const OHLCVBarSchema = z.object({
  timestamp: z.string(),
  open: z.string(),
  high: z.string(),
  low: z.string(),
  close: z.string(),
  volume: z.string(),
});

export const SimCreateResponseSchema = z.object({
  simulation_id: z.number(),
  status: z.string(),
  positions: z.record(z.string()),
  nav: z.string(),
  bars: z.record(z.array(OHLCVBarSchema)),
});

export const AssetSummarySchema = z.object({
  ticker: z.string(),
  current_price: z.number().positive(),
  daily_high: z.number().positive(),
  daily_low: z.number().positive(),
  open_price: z.number().positive().optional(),
  timestamp: z.string(),
});

export const AssetPricesResponseSchema = z.array(OHLCVSchema);

export const RealTimeTickSchema = z.object({
  timestamp: z.string(),
  price: z.coerce.number().positive(),
  volume: z.coerce.number().nonnegative(),
});

export const RealTimeDataResponseSchema = z.object({
  points: z.array(RealTimeTickSchema),
});

export const ChartBarSchema = z.object({
  time: z.string(),
  open: z.number().nullable().default(null),
  high: z.number().nullable().default(null),
  low: z.number().nullable().default(null),
  close: z.number().nullable().default(null),
  volume: z.number().default(0),
});

export const ChartBarsResponseSchema = z.array(ChartBarSchema);

export const RealTimeSymbolsResponseSchema = z.object({
  symbols: z.array(z.string()),
  count: z.number().nonnegative(),
});

export const MoverSchema = z.object({
  ticker: z.string(),
  current_price: z.coerce.number(),
  daily_high: z.coerce.number(),
  daily_low: z.coerce.number(),
  pct_change: z.number(),
  timestamp: z.string(),
});

export const MoversResponseSchema = z.object({
  movers: z.array(MoverSchema),
});

export type SimCreateResponse = z.infer<typeof SimCreateResponseSchema>;
export type OHLCVBar = z.infer<typeof OHLCVBarSchema>;
export type OHLCV = z.infer<typeof OHLCVSchema>;
export type AssetSummary = z.infer<typeof AssetSummarySchema>;
export type AssetPricesResponse = z.infer<typeof AssetPricesResponseSchema>;
export type RealTimeTick = z.infer<typeof RealTimeTickSchema>;
export type RealTimeDataResponse = z.infer<typeof RealTimeDataResponseSchema>;
export type RealTimeSymbolsResponse = z.infer<typeof RealTimeSymbolsResponseSchema>;
export type ChartBar = z.infer<typeof ChartBarSchema>;
export type ChartInterval = '1d' | '1w' | '1m' | '6m' | '1y';
export type Mover = z.infer<typeof MoverSchema>;
export type MoversResponse = z.infer<typeof MoversResponseSchema>;