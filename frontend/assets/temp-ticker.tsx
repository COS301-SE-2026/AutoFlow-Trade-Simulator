'use client'

import AssetSummaryBar from '../components/AssetSummaryBar';
import PriceChart from '../components/charts/priceChart';

export default function TickerPage() {
    return (
        <>
        <section>
            <AssetSummaryBar ticker='yippee'/>
        </section>
        <section>
            <PriceChart ticker='someticker'/>
        </section>
        </>
    );
}