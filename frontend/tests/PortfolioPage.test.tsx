import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import PortfolioPage from '@/app/portfolio/page'
import { useAccount } from '@/lib/hooks/accountContext'
import { useHoldings } from '@/hooks/useHoldings'

jest.mock('@/lib/hooks/accountContext', () => ({
    useAccount: jest.fn(),
}))

jest.mock('@/hooks/useHoldings', () => ({
    useHoldings: jest.fn(),
}))

jest.mock('@/components/navbar', () => ({
    Navbar: () => <nav data-testid="navbar-mock">Navbar</nav>,
}))

jest.mock('@/components/tradingAuthPrompt', () => ({
    TradingAuthPrompt: () => <div data-testid="auth-prompt-mock">Trading Auth Prompt</div>
}))

jest.mock('@/components/portfolioCashBalance', () => ({
    PortfolioCashBalance: ({ accountId }: { accountId: string }) => (
        <div data-testid="cash-balance-mock">Cash Balance: {accountId} </div>
    )
}))

jest.mock('@/components/portfolioInvested', () => ({
    PortfolioInvested: ({ accountId }: { accountId: string }) => (
        <div data-testid="invested-mock">Invested: {accountId} </div>
    )
}))

jest.mock('@/components/portfolioTotalValue', () => ({
    PortfolioTotalValue: ({ accountId }: { accountId: string }) => (
        <div data-testid="total-value-mock">Total Value: {accountId} </div>
    )
}))

jest.mock('@/components/HoldingsSummary', () => ({
    HoldingsSummary: ({
        selectedTicker,
        onSelectAction,
        holdings,
        loading,
        error
    }: any) => {
        const holdingCount = holdings?.length ?? 0
        return (
            <div data-testid="holdings-mock">
                Holdings: {selectedTicker || 'none'}
                {loading && ' (loading)'}
                {error && ` (error: ${error})`}
                {!loading && !error && ` (${holdingCount} holdings)`}
                <button
                    data-testid="select-msft-btn"
                    onClick={() => onSelectAction('MSFT')}>
                    Select MSFT
                </button>
            </div>
        )
    }
}))

jest.mock('@/components/AssetSummaryBar', () => ({
    __esModule: true,
    default: ({ ticker, holding }: any) => (
        <div data-testid='asset-summary-mock'>
            Asset Summary: {ticker}
            {holding ? `(holding: ${holding.ticker})` : '(no holding)'}
        </div>
    )
}))

jest.mock('@/components/charts/portfolioPerformanceChart', () => ({
    PortfolioPerformanceChart: ({ accountId }: { accountId: string }) => (
        <div data-testid="performance-chart-mock">performance chart: {accountId} </div>
    )
}))

describe('PortfolioPage', () => {
    const mockUseAccount = useAccount as jest.Mock
    const mockUseHoldings = useHoldings as jest.Mock

    const mockHoldings = [
        { ticker: 'AAPL', quantity: 10, average_cost: 150.00 },
        { ticker: 'MSFT', quantity: 10, average_cost: 150.00 },
        { ticker: 'GOOGL', quantity: 10, average_cost: 150.00 },
    ]

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders the auth prompt when there is no active account', () => {
        mockUseAccount.mockReturnValue({ activeAccount: null })
        mockUseHoldings.mockReturnValue({
            holdings: [],
            loading: false,
            error: null,
        })

        render(<PortfolioPage />)

        expect(screen.getByTestId('navbar-mock')).toBeInTheDocument()

        const authPrompts = screen.getAllByTestId('auth-prompt-mock')
        expect(authPrompts).toHaveLength(2)

        expect(screen.queryByTestId('cash-balance-mock')).not.toBeInTheDocument()
        expect(screen.queryByTestId('invested-mock')).not.toBeInTheDocument()
        expect(screen.queryByTestId('total-value-mock')).not.toBeInTheDocument()
        expect(screen.queryByTestId('holdings-mock')).not.toBeInTheDocument()
        expect(screen.queryByTestId('performance-chart-mock')).not.toBeInTheDocument()

        expect(screen.getByTestId('asset-summary-mock')).toHaveTextContent('(no holding)')
    })

    it('renders portfolio balances when an active account exists', () => {
        mockUseAccount.mockReturnValue({ activeAccount: { id: 12345 } })
        mockUseHoldings.mockReturnValue({
            holdings: [
                { ticker: 'AAPL', quantity: 10, average_cost: 150.00 },
            ],
            loading: false,
            error: null,
        })

        render(<PortfolioPage />)

        expect(screen.getByTestId('navbar-mock')).toBeInTheDocument()

        expect(screen.getByTestId('cash-balance-mock')).toHaveTextContent('12345')
        expect(screen.getByTestId('invested-mock')).toHaveTextContent('12345')
        expect(screen.getByTestId('total-value-mock')).toHaveTextContent('12345')
        expect(screen.getByTestId('holdings-mock')).toBeInTheDocument()
        expect(screen.getByTestId('performance-chart-mock')).toHaveTextContent('12345')

        expect(screen.queryByTestId('auth-prompt-mock')).not.toBeInTheDocument()
    })
})