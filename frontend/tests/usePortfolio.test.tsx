import { renderHook,  } from '@testing-library/react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { apiClient,  } from '@/lib/api';

import { useAccount } from '@/lib/hooks/accountContext';
import { useHoldings } from '@/hooks/useHoldings';

jest.mock('@/lib/hooks/accountContext', () => ({
    useAccount: jest.fn()
}))

jest.mock('@/hooks/useHoldings', () => ({
    useHoldings: jest.fn()
}))

const mockUseAccount = useAccount as jest.MockedFunction<typeof useAccount>;
const mockUseHoldings = useHoldings as jest.MockedFunction<typeof useHoldings>;

const mockActiveAccount = {
    id: 1,
    portfolio_id: 1,
    currency_id: 1,
    currency_code: 'ZAR',
    balance: '100.00',
    created_at: new Date(),
}

const mockPortfolio = {
    cashBalance: 100,
    currencyCode: 'ZAR',
    investedValue: 100,
    totalValue: 100,
    numHoldings: 100,
    activeAccount: mockActiveAccount,
    holdings: [
        {
            asset_id: 1,
            ticker: 'AAPL',
            net_quantity: 1,
            current_price: 1,
            average_cost: 1,
            unrealised_pnl: 1,
        },
        {
            asset_id: 2,
            ticker: 'GOOGL',
            net_quantity: 2,
            current_price: 2,
            average_cost: 2,
            unrealised_pnl: 2,
        },
    ],
    profitLoss: 100,
    profitLossPercent: 0.1
}

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>

describe('usePortfolio', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    it('returns expected portfolio information', async () => {
        mockUseAccount.mockReturnValue({
            activeAccount: mockActiveAccount,
            accounts: [mockActiveAccount],
            isLoading: false,
            error: null,
            create: jest.fn(),
            update: jest.fn(),
        });
        mockUseHoldings.mockReturnValue({
            holdings: mockPortfolio.holdings,
            loading: false,
            error: null,
            refetch: jest.fn(),
        })

        const { result } = renderHook(() => usePortfolio(mockActiveAccount.id));

        expect(result.current.cashBalance).toBe(100);

        expect(result.current.currencyCode).toBe(mockPortfolio.currencyCode);

        expect(result.current.investedValue).toBe(5);

        expect(result.current.totalValue).toBe(105);

        expect(result.current.numHoldings).toBe(2);

        expect(result.current.activeAccount).toBe(mockActiveAccount);

        expect(result.current.holdings).toBe(mockPortfolio.holdings);

        expect(result.current.profitLoss).toBe(0);

        expect(result.current.profitLossPercent).toBe(0);
    });

    it('avoids divide by 0 when total cost is 0', async () => {
        mockUseAccount.mockReturnValue({
            activeAccount: mockActiveAccount,
            accounts: [mockActiveAccount],
            isLoading: false,
            error: null,
            create: jest.fn(),
            update: jest.fn(),
        });
        mockUseHoldings.mockReturnValue({
            holdings: [
                {
                    asset_id: 1,
                    ticker: 'AAPL',
                    net_quantity: 1,
                    current_price: 1,
                    average_cost: 0,
                    unrealised_pnl: 1,
                },
                {
                    asset_id: 2,
                    ticker: 'GOOGL',
                    net_quantity: 2,
                    current_price: 2,
                    average_cost: 0,
                    unrealised_pnl: 2,
                },
            ],
            loading: false,
            error: null,
            refetch: jest.fn(),
        })

        const { result } = renderHook(() => usePortfolio(mockActiveAccount.id));

        expect(result.current.profitLossPercent).toBe(0);
    });
})