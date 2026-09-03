import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import PortfolioPage from '@/app/portfolio/page'
import { useAccount } from '@/lib/hooks/accountContext'
import { TradingAuthPrompt } from '@/components/tradingAuthPrompt'
import { PortfolioCashBalance } from '@/components/portfolioCashBalance'
import { PortfolioInvested } from '@/components/portfolioInvested'
import { PortfolioTotalValue } from '@/components/portfolioTotalValue'

jest.mock('@/lib/hooks/accountContext', () => ({
    useAccount: jest.fn(),
}))

jest.mock('@/lib/hooks/useRealTimeTicks', () => ({
    useRealTimeTicks: jest.fn(),
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
    HoldingsSummary: ({ accountId }: { accountId: string }) => (
        <div data-testid="holdings-mock">Holdings: {accountId} </div>
    )
}))

jest.mock('@/components/AssetSummaryBar', () => ({
    __esModule: true,
    AssetSummaryBar: ({ ticker }: { ticker: string }) => (
        <div data-testid="asset-summary-mock">Asset Summary: {ticker} </div>
    )
}))

jest.mock('@/components/charts/priceChart', () => ({
    __esModule: true,
    AssetSummaryBar: ({ ticker }: { ticker: string }) => (
        <div data-testid="price-chart-mock">price Chart: {ticker} </div>
    )
}))

jest.mock('@/headlessui/react', () => ({
    Combobox: ({ children, value, onChange }: any) => (
        <div data-testid="combobox-mock" data-value={value}>
            {children}
            <button
                data-testid="combobox-select-button"
                onClick={() => onChange('MSFT')}>
                Select MSFT
            </button>
        </div>
    ),
    ComboboxInput: ({ placeholder, onChange }: any) => (
        <input
            data-testid="combobox-input"
            placeholder={placeholder}
            onChange={onChange}
        />
    )
}))

jest.mock('lucide-react', () => ({
    Search: () => <span data-testid="search-icon">?</span>
}))

describe('PortfolioPage', () => {
    const mockUseAccount = useAccount as jest.Mock

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders the auth prompt when there is no active account', () => {
        mockUseAccount.mockReturnValue({ activeAccount: null })

        render(<PortfolioPage />)

        expect(screen.getByRole('main')).toBeInTheDocument()
        expect(screen.getByTestId('navbar-mock')).toBeInTheDocument()

        expect(screen.getByTestId('auth-prompt-mock')).toBeInTheDocument()

        expect(screen.queryByTestId('cash-balance-mock')).not.toBeInTheDocument()
        expect(screen.queryByTestId('invested-mock')).not.toBeInTheDocument()
        expect(screen.queryByTestId('total-value-mock')).not.toBeInTheDocument()
    })

    it('renders portfolio balances when an active account exists', () => {

        mockUseAccount.mockReturnValue({
            activeAccount: { id: 'acc_12345' }
        })

        render(<PortfolioPage />)

        expect(screen.getByRole('main')).toBeInTheDocument()
        expect(screen.getByTestId('navbar-mock')).toBeInTheDocument()

        expect(screen.getByTestId('cash-balance-mock')).toHaveTextContent('acc_12345')
        expect(screen.getByTestId('invested-mock')).toHaveTextContent('acc_12345')
        expect(screen.getByTestId('total-value-mock')).toHaveTextContent('acc_12345')

        expect(screen.queryByTestId('auth-prompt-mock')).not.toBeInTheDocument()
    })
})