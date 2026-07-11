'use client';

import { useState } from 'react';
import { Activity } from 'lucide-react';

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
        example: '',
        chartLabel: '',
        chartData: Array.from({ length: 50 }, (_, i) => ({
            x: i * 4 + 200,
            y: 0.3 * Math.exp(-0.002 * Math.pow(i * 4 + 200 - 350, 2)),
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
                                <div key={row.name}>
                                    <button
                                        onClick={() => toggleRow(row.name)}
                                    >
                                        <div>
                                            <span>{row.symbol}</span>
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}