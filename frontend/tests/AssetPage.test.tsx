import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AssetPage from '@/app/assets/[ticker]/page'
import { useParams } from 'next/navigation'
import { usePrices } from '@/hooks/usePrices'
import { useAssetSummary } from '@/hooks/useAssetSummary'
import { useHoldings } from '@/hooks/useHoldings'
import { useAccount } from '@/lib/hooks/accountContext'
import { apiClient } from '@/lib/api'

jest.mock('next/navigation', () => ({
    useParams: jest.fn()
}))

jest.mock('@/hooks/usePrices', () => ({ usePrices: jest.fn() }))
jest.mock('@/hooks/useAssetSummary', () => ({ useAssetSummary: jest.fn() }))
jest.mock('@/hooks/useHoldings', () => ({ useHoldings: jest.fn()}))
jest.mock('@/lib/hooks/accountContext', () => ({ useAccount: jest.fn() }))
jest.mock('@/lib/api', () => ({ apiClient: jest.fn() }))

jest.mock('@/components/navbar', () => ({ Navbar: () => <nav data-testid="navbar-mock">Navbar</nav> }));
jest.mock('@/components/AssetSummaryBar', () => ({ __esModule: true, default: ({ default: ({ ticker }: { ticker: string }) => <div data-testid="summary-bar-mock">{ticker}</div>})}))
jest.mock('@/components/liveDataGraph', () => ({ LiveDataGraph: ({ symbol }: { symbol: string }) => <div data-testid="graph-mock">{symbol}</div> }))

jest.mock('@/components/BuySellForm', () => ({
    __esModule: true,
    default: ({ price, accountBalance, currentHoldings, onBuy, onSell }: any) => (
        <div data-testid="buy-sell-form-mock">
            <span data-testid="form-price">{price}</span>
            <span data-testid="form-balance">{accountBalance}</span>
            <span data-testid="form-holdings">{currentHoldings}</span>
            <button data-testid="trigger-buy" onClick={(() => onBuy(10, 'market'))}>Buy Units</button>
            <button data-testid="trigger-sell" onClick={() => onSell(5, 'market')}>Sell Units</button>
        </div>
    )
}))

describe('AssetPage', () => {
    
})