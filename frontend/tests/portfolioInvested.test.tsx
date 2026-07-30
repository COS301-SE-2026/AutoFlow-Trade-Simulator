import { render, screen,  } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PortfolioInvested } from '@/components/portfolioInvested';

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

describe('PortfolioInvested content present', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    describe('PortfolioInvested', () => {
        it('should render all basic information', async () => {
            jest.spyOn(require('@/hooks/usePortfolio'), 'usePortfolio').mockReturnValue(
                mockPortfolio
            );

            render(
                <PortfolioInvested accountId={mockActiveAccount.id} />
            );

            expect(screen.getByText('Invested')).toBeInTheDocument();
            expect(screen.getByText(`${mockPortfolio.currencyCode} ${mockPortfolio.investedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)).toBeInTheDocument();
            expect(screen.getByText(`Across ${mockPortfolio.numHoldings} positions`)).toBeInTheDocument();
        });
    });
})