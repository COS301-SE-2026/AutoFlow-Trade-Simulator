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
]