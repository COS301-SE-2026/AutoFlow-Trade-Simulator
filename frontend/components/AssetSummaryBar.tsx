'use client'

import { useState, useEffect } from 'react';
import {useAssetSummary} from '../hooks/useAssetSummary'

interface SummaryBarProps {
    ticker: string;
}

export default function AssetSummaryBar({ticker}: SummaryBarProps) {
    const { data, loading } = useAssetSummary(ticker, 'daily');

    return (
        <>
        <div className='card' style={{display: 'flex', flexDirection:'row', justifyContent:'space-evenly'}}>
            <div>TICKER: {ticker}</div>
            <div>DAILY PRICE:</div>
            <div>DAILY HIGH:</div>
            <div>DAILY LOW:</div>
        </div>
        </>
    );
}