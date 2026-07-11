'use client';

import { useState } from 'react';

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
        tagline: '',
        example: '',
        chartLabel: '',
        chartData: Array.from({ length: 50 }, (_, i) => ({
            x: i * 4 + 200,
            y: 1 / (1 + Math.exp(-0.05 * (i * 4 + 200 - 350))),
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
                <div className='w-8 h-8 rounded-xl bg-[var(--background)] grid'>
                    <div>Greek</div>
                    <div>Range</div>
                    <div>ATM Behaviour</div>
                    <div>What It Measures</div>
                    <div>Long Options</div>
                    <div>Short Options</div>
                </div>
                <div className='flex flex-col flex-1 bg-card border border-border rounded-xl'>
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
    );
}