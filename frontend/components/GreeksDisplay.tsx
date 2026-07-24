'use client';

import { useState } from 'react';
import { Activity, BarChart2, Zap } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface GreekData {
    symbol: string;
    name: string;
    color: string;
    range: string;
    atm: string;
    definition: string;
    long: string;
    short: string;
    tagline: string;
    example: string;
    chartLabel: string;
    chartData: { x: number; y: number }[];
};

const greeks: GreekData[] = [
    {
        symbol: 'Δ',
        name: 'Delta',
        color: 'var(--blue)',
        range: '0 → 1 (Calls) / -1 → 0 (Puts)',
        atm: '~0.50',
        definition:
        'Option price change per $1 move in the underlying. ATM calls ≈ 0.50; deep ITM → 1.00',
        long: 'Profits from directional moves. A 0.60 delta call gains R60 per R1 stock rise.',
        short: 'Directional risk. Must delta-hedge to stay neutral.',
        tagline: 'How much does an option price move per R1 in the stock?',
        example: 'You hold a TSLA call with Δ = 0.55. TSLA rises R10, Your option gains ~R5.50 in value.',
        chartLabel: 'Delta vs. Stock Price',
        chartData: Array.from({ length: 50 }, (_, i) => ({
            x: i * 4 + 200,
            y: 1 / (1 + Math.exp(-0.05 * (i * 4 + 200 - 350))),
        })),
    },
    {
        symbol: 'Γ',
        name: 'Gamma',
        color: 'var(--purple)',
        range: '0 → ∞ (peaks ATM)',
        atm: 'Highest ATM',
        definition: 'Rate of change of Delta per R1 move. High gamma near expiry/ATM means Delta can swing fast.',
        long: 'Accelerating gains as stock moves favorably - convex payoff.',
        short: 'Gamma risk - losses accelerate. Short gamma can blow up near expiration.',
        tagline: 'How fast does Delta itself change?',
        example: 'Your opton has Γ = 0.08. The stock rises R1, so Delta increases by 0.08 - from 0.50 to 0.58.',
        chartLabel: 'Gamma vs. Stock Price (Peaks ATM)',
        chartData: Array.from({ length: 50 }, (_, i) => ({
            x: i * 4 + 200,
            y: 0.3 * Math.exp(-0.002 * Math.pow(i * 4 + 200 - 350, 2)),
        })),
    },
    {
        symbol: 'Θ',
        name: 'Theta',
        color: 'var(--orange)',
        range: 'Negative (buyers) / Positive (sellers)',
        atm: 'Decay fastest ATM',
        definition: 'Daily time decay of extrinsic value. Accelerates in final 30 days before expiration.',
        long: 'Lost value every day. Buying options = fighting the clock.',
        short: 'Collect daily income. Theta works for you as a net seller.',
        tagline: 'How much value does an option lose each day?',
        example: 'You own a call with Θ = -0.12. Every day that passes, your option loses R12 per contract in time value.',
        chartLabel: 'Theta decay accelerates near expiry',
        chartData: Array.from({ length: 60 }, (_, i) => ({
            x: 60 - i,
            y: -0.05 * Math.exp(0.06 * i),
        })),
    },
    {
        symbol: 'v',
        name: 'Vega',
        color: 'var(--seafoam)',
        range: 'Always positive (long) / negative (short)',
        atm: 'Highest ATM, decays over time',
        definition: 'Sensitivity to 1% change in implied volatility (IV). Vega peaks ATM and falls as expiration approaches.',
        long: 'Profit from IV expansion - ideal before earnings or macro events.',
        short: 'Profit from IV crush. Sell options when IV is high; but back when it drops.',
        tagline: 'How does the option price respond to volatility changes?',
        example: 'You buy an NVDA straddle before earnings. IV jumps 15%. With Vega = 0.30, each leg gains ~R4.50.',
        chartLabel: 'Vega vs. Implied Volatility (%)',
        chartData: Array.from({ length: 50 }, (_, i) => ({
            x: i * 0.8 + 10,
            y: 0.3 * Math.exp(-0.03 * Math.pow(i * 0.8 + 10 - 30, 2)),
        })),
    },
    {
        symbol: 'ρ',
        name: 'Rho',
        color: 'var(--green-light)',
        range: '+ for calls / - for puts',
        atm: 'Small; matters for LEAPS',
        definition: 'Sensitivity to 1% change in risk-free interest rate. Minor for short-dated options, relevant for LEAPS (>1 year).',
        long: 'LEAPS calls gain when rates rise (cost-of-carry increases stock forward price).',
        short: 'Short-dated options most unaffected; LEAPS puts lose value when rates rise.',
        tagline: 'How does the option price change with interest rates?',
        example: 'You hold a 2-year LEAPS call with ρ = 0.45. The Fed hikes by 0.25%. Your call gains ~R11.25 per contract.',
        chartLabel: 'Rho: linear with interest rate',
        chartData: Array.from({ length: 40 }, (_, i) => ({
            x: i * 0.25,
            y: 0.45 * i * 0.25,
        })),
    },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) 
  {
    const data = payload[0].payload;
    return (
      <div style={{
        backgroundColor: '#414042',
        border: '1px solid #ffffff4b',
        padding: '8px',
        borderRadius: '4px',
      }}>
        <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>x: {data.x}</p>
        <p style={{ margin: '2px 0', fontSize: '12px'}}>y: {data.y.toFixed(4)}</p>
      </div>
    );
  }
  return null;
};

export default function GreeksDisplay() {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const toggleRow = (name: string) => {
        setExpandedRow((prev) => (prev === name ? null : name))
    };

    return (
        <div className='flex flex-col h-full gap-4'>
            <div className='flex items-center gap-3'>
                <div className='w-8 h-8 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center'>
                    <Activity className='w-4 h-4 text-white'/>
                </div>
                <div>
                    <h2 className='text-lg font-bold text-white'>Options Greeks Reference</h2>
                    <p className='text-sm text-muted-foreground'>
                        Click any row to expand with charts and examples
                    </p>
                </div>
                <div className='flex-1 flex flex-col bg-card border rounded-xl'>
                    <div className='grid grid-cols-[60px_1.2fr_1fr_1fr_1.2fr_1.2fr] gap-3 px-5 py-3 bg-blur/50 border-b text-xs font-semibold uppercase'>
                        <div>Greek</div>
                        <div>Range</div>
                        <div>ATM Behaviour</div>
                        <div>What It Measures</div>
                        <div className='text-[var(--green)]'>Long Options</div>
                        <div className='text-[var(--red)]'>Short Options</div>
                    </div>
                    <div className='flex-1 overflow-y-auto'>
                        {greeks.map((row) => {
                            const isExpanded = expandedRow === row.name;
                        
                            return (
                                <div key={row.name} className='border-b last:border-0'>
                                    <button
                                        className={`w-full grid grid-cols-[60px_1.2fr_1fr_1fr_1.2fr_1.2fr] gap-3 px-5 py-4 text-sm text-left transition-colors hover:bg-muted/30
                                            ${isExpanded ? 'bg-muted/20' : '' }`
                                        }
                                        onClick={() => toggleRow(row.name)}
                                    >
                                    <div className='flex items-center gap-2'>
                                        <span className='text-xl font-bold' style={{ color: row.color }}>
                                            {row.symbol}
                                        </span>
                                        <span className='font-medium text-xs'>
                                            {row.name}
                                        </span>
                                    </div>
                                    <div className='text-muted-foreground text-xs self-center leading-relaxed'>
                                        {row.range}
                                    </div>
                                    <div className='text-xs self-center leading-relaxed'>
                                        {row.atm}
                                    </div>
                                    <div className='text-xs self-center leading-relaxed'>
                                        {row.definition}
                                    </div>
                                    <div className='text-muted-foreground text-xs self-center leading-relaxed'>
                                        {row.long}
                                    </div>
                                    <div className='text-muted-foreground text-xs self-center leading-relaxed'>
                                        {row.short}
                                    </div>
                                    </button>
                                    {isExpanded && (
                                        <div className='px-5 pb-5 bg-muted/10'>
                                            <div className='grid grid-cols-2 gap-6 pt-4 border-t'>
                                                <div>
                                                    <h4 className='text-xs font-semibold mb-2 flex items-center gap-1.5'>
                                                        <BarChart2 className='w-3.5 h-3.5' style={{ color: row.color }} />
                                                        {row.chartLabel}
                                                    </h4>
                                                    <div style={{ width: '100%', height: '250px'}}>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart
                                                            data={row.chartData}
                                                            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                                                            >
                                                            <defs>
                                                                <linearGradient id={`grad-${row.name}`} x1='0' y1='0' x2='0' y2='1'>
                                                                    <stop offset='5%' stopColor={row.color} stopOpacity={0.8} />
                                                                    <stop offset='95%' stopColor={row.color} stopOpacity={0.02} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff59" />
                                                            <XAxis dataKey="x" stroke="#ffffff" tick={{ fontSize: 10 }}/>
                                                            <YAxis stroke="#ffffff" tickFormatter={(v) => v.toFixed(2)} width={55} tick={{ fontSize: 10 }} />
                                                            <Tooltip
                                                                cursor={{ stroke: '#9ca3af' }}
                                                                content={<CustomTooltip />}
                                                            />
                                                            <Area
                                                                type="monotone"
                                                                dataKey="y"
                                                                stroke={row.color}
                                                                strokeWidth={4}
                                                                fill={`url(#grad-${row.name})`}
                                                                dot={false}
                                                                activeDot={{ r: 8, stroke: '#1c75bc' }}
                                                            />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>

                                                <div className='flex flex-col gap-3'>
                                                    <div>
                                                        <h4 className='text-xs font-semibold mb-1.5 items-center gap-1.5'>
                                                            <Zap className='w.3.5 h-3.5 text-white' />
                                                            Real World Example
                                                        </h4>
                                                        <div className='border border-border rounded-xl p-3'>
                                                            <p className='text-sm leading-relaxed'>
                                                                {row.example}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className='flex gap-3'>
                                                        <div className='flex-1 bg-[#8dc63f]/5 border border-[#8dc63f]/20 rounded-xl p-3'>
                                                            <h5 className='text-xs font-semibold mb-1'>
                                                                Long Position
                                                            </h5>
                                                            <p className='text-xs leading-relaxed'>
                                                                {row.long}
                                                            </p>
                                                        </div>
                                                        <div className='flex-1 bg-[#ed1c24]/2 border border-[#ed1c24]/20 rounded-xl p-3'>
                                                            <h5 className='text-xs font-semibold mb-1'>
                                                                Short Position
                                                            </h5>
                                                            <p className='text-xs leading-relaxed'>
                                                                {row.short}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h5 className='text-xs font-semibold mb-1'>
                                                            IN PLAIN ENGLISH
                                                        </h5>
                                                        <p className='text-xs'><i>{row.tagline}</i></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}