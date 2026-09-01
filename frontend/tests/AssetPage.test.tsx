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
jest.mock('@/components/AssetSummaryBar', () => ({__esModule: true,default: ({ ticker }: { ticker: string }) => <div data-testid="summary-bar-mock">{ticker}</div>}))
jest.mock('@/components/liveDataGraph', () => ({ LiveDataGraph: ({ symbol }: { symbol: string }) => <div data-testid="graph-mock">{symbol}</div> }))
jest.mock('@/components/TickerSearch', () => ({ TickerSearch: () => <div>Mock TickerSearch</div>}));

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
    const mockRefetchHoldings = jest.fn();
    const mockRefetchAccounts = jest.fn();
    const mockUseParams = useParams as jest.Mock;
    const mockUsePrices = usePrices as jest.Mock;
    const mockUseAssetSummary = useAssetSummary as jest.Mock;
    const mockUseHoldings = useHoldings as jest.Mock;
    const mockUseAccount = useAccount as jest.Mock;
    const mockApiClient = apiClient as jest.Mock;

    const defaultAccount = { id: 'acc_123', balance: '5000.50'}

    beforeEach(() => {
        jest.clearAllMocks();

        mockUseParams.mockReturnValue({ ticker: 'BTC-USD' })
        mockUsePrices.mockReturnValue({
            data: [{ close: 50000 }],
            loading: false,
            error: null
        })
        mockUseAssetSummary.mockReturnValue({
            data: { current_price: 50000 },
            loading: false,
            error: null
        })
        mockUseAccount.mockReturnValue({ 
            activeAccount: defaultAccount,
            refetchAccounts: mockRefetchAccounts
        })
        mockUseHoldings.mockReturnValue({
            holdings: [{ ticker: 'BTC/USD', net_quantity: 2.5 }],
            refetch: mockRefetchHoldings
        })
    })

    describe('Page Rendering & States', () => {
        it('renders loading state when data is loading', () => {
            mockUsePrices.mockReturnValue({data: [], loading: true, error: null})
            render(<AssetPage/>)
            expect(screen.getByText('Loading...')).toBeInTheDocument()
        })

        it('renders error state when prices or summary fails', () => {
            mockUsePrices.mockReturnValue({ data: [], loading: false, error: 'Failed to fetch prices'})
            render(<AssetPage />)
            expect(screen.getByText(/Error: Failed to fetch prices/i)).toBeInTheDocument();
        })

        it('renders invalid ticker message if no ticker is present in URL', () => {
            mockUseParams.mockReturnValue({})
            render(<AssetPage />)
            expect(screen.getByText('Invalid ticker')).toBeInTheDocument()
        })

        it('replaces URL hyphens with slashes in ticker (e.g. BTC-USD -> BTC/USD)', () => {
            render(<AssetPage/>)

            expect(screen.getByTestId('form-price')).toHaveTextContent('50000')
            expect(screen.getByTestId('form-balance')).toHaveTextContent('5000.5')
            expect(screen.getByTestId('form-holdings')).toHaveTextContent('2.5')
        })
    })

    describe('Buy Trade Execution', () => {
        it('executes buy order and refetches holdings on success', async () => {
            mockApiClient.mockResolvedValueOnce({ success: true })
            render(<AssetPage/>)

            fireEvent.click(screen.getByTestId('trigger-buy'))

            expect(await screen.findByText('Successfully bought 10 units of BTC/USD')).toBeInTheDocument();

            expect(mockApiClient).toHaveBeenCalledWith('/portfolio/accounts/acc_123', {
                method: 'POST',
                body: { ticker: 'BTC/USD', direction: 'buy', quantity: 10}
            })
            expect(mockRefetchHoldings).toHaveBeenCalled()
            expect(mockRefetchAccounts).toHaveBeenCalled()
        })

        it('shows error alert if buy order API call fails', async() => {
            mockApiClient.mockRejectedValueOnce(new Error('Network Error'));
            render(<AssetPage/>)

            fireEvent.click(screen.getByTestId('trigger-buy'))

            expect(await screen.findByText('Failed to execute order: Network Error')).toBeInTheDocument();
        })

        it('alerts user if no active account is selected when buying', async () => {
            mockUseAccount.mockReturnValue({ activeAccount: null, refetchAccounts: jest.fn() })
            render(<AssetPage/>)

            fireEvent.click(screen.getByTestId('trigger-buy'))

            expect(await screen.findByText('No active account is selected')).toBeInTheDocument();
            expect(mockApiClient).not.toHaveBeenCalled();
        })
    })

    describe('Sell Trade Execution', () => {
        it('executes sell order and refecthes holdings on success', async () => {
            mockApiClient.mockResolvedValueOnce({ success: true })
            render(<AssetPage />)

            fireEvent.click(screen.getByTestId('trigger-sell'))

            expect(await screen.findByText('Successfully sold 5 units of BTC/USD')).toBeInTheDocument();

            expect(mockApiClient).toHaveBeenCalledWith('/portfolio/accounts/acc_123', {
                method: 'POST',
                body: { ticker: 'BTC/USD', direction: 'sell', quantity: 5 },
            });
            expect(mockRefetchHoldings).toHaveBeenCalled();
            expect(mockRefetchAccounts).toHaveBeenCalled();
        })
    })
})