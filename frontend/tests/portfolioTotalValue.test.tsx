import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PortfolioTotalValue } from '@/components/portfolioTotalValue';

const mockActiveAccount = {
    id: 1,
    portfolio_id: 1,
    currency_id: 1,
    currency_code: 'ZAR',
    balance: '100.00',
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
            ticker: 'AAPL',
            net_quantity: 1,
            current_price: 1,
            average_cost: 1,
        }, {
            ticker: 'GOOGL',
            net_quantity: 1,
            current_price: 1,
            average_cost: 1,
        },
    ],
    profitLoss: 100,
    profitLossPercent: 0.1
}

jest.mock('@/hooks/usePortfolio', () => ({
    usePortfolio: () => (mockPortfolio),
}))

describe('PortfolioTotalValue content present', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    describe('PortfolioTotalValue', () => {
        it('should render all basic information', async () => {
            jest.spyOn(require('@/hooks/usePortfolio'), 'usePortfolio').mockReturnValue(
                mockPortfolio
            );

            render(
                <PortfolioTotalValue accountId={mockActiveAccount.id} />
            );

            expect(screen.getByText('Total Value')).toBeInTheDocument();
            expect(screen.getByText(`${mockPortfolio.currencyCode} ${mockPortfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)).toBeInTheDocument();

            const isPositive = mockPortfolio.profitLoss >= 0;
            expect(screen.getByText(`${isPositive ? '+' : ''}${mockPortfolio.profitLossPercent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`)).toBeInTheDocument();
        });

        it('trending up icon showing for positive profit loss', async () => {
            jest.spyOn(require('@/hooks/usePortfolio'), 'usePortfolio').mockReturnValue({
                cashBalance: 100,
                currencyCode: 'ZAR',
                investedValue: 100,
                totalValue: 100,
                numHoldings: 100,
                activeAccount: mockActiveAccount,
                holdings: [
                    {
                        ticker: 'AAPL',
                        net_quantity: 1,
                        current_price: 1,
                        average_cost: 1,
                    }, {
                        ticker: 'GOOGL',
                        net_quantity: 1,
                        current_price: 1,
                        average_cost: 1,
                    },
                ],
                profitLoss: 100,
                profitLossPercent: 0.1
            });

            render(
                <PortfolioTotalValue accountId={mockActiveAccount.id} />
            );

            const trendingIcon = screen.getByTestId('TrendingUp');
            expect(trendingIcon).toBeInTheDocument();
        });

        it('trending down icon showing for negative profit loss', async () => {
            jest.spyOn(require('@/hooks/usePortfolio'), 'usePortfolio').mockReturnValue({
                cashBalance: 100,
                currencyCode: 'ZAR',
                investedValue: 100,
                totalValue: 100,
                numHoldings: 100,
                activeAccount: mockActiveAccount,
                holdings: [
                    {
                        ticker: 'AAPL',
                        net_quantity: 1,
                        current_price: 1,
                        average_cost: 1,
                    }, {
                        ticker: 'GOOGL',
                        net_quantity: 1,
                        current_price: 1,
                        average_cost: 1,
                    },
                ],
                profitLoss: -100,
                profitLossPercent: -0.1
            });

            render(
                <PortfolioTotalValue accountId={mockActiveAccount.id} />
            );

            const trendingIcon = screen.getByTestId('TrendingDown');
            expect(trendingIcon).toBeInTheDocument();
        });
    });
})