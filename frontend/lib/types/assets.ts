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
  open: z.number().positive(),
  high: z.number().positive(),
  low: z.number().positive(),
  close: z.number().positive(),
  volume: z.number().nonnegative(),
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
  timestamp: z.string(),
});

export const AssetPricesResponseSchema = z.array(OHLCVSchema);

export type SimCreateResponse = z.infer<typeof SimCreateResponseSchema>;
export type OHLCVBar = z.infer<typeof OHLCVBarSchema>;
export type OHLCV = z.infer<typeof OHLCVSchema>;
export type AssetSummary = z.infer<typeof AssetSummarySchema>;
export type AssetPricesResponse = z.infer<typeof AssetPricesResponseSchema>;