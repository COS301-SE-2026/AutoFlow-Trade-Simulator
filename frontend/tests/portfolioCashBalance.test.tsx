import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PortfolioCashBalance } from '@/components/portfolioCashBalance';

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
    holdings: 100,
    profitLoss: 100,
    profitLossPercent: 0.1
}

jest.mock('@/hooks/usePortfolio', () => ({
    usePortfolio: () => (mockPortfolio),
}))

describe('PortfolioCashBalance content present', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    describe('PortfolioCashBalance', () => {
        it('should render all basic information', async () => {
            jest.spyOn(require('@/hooks/usePortfolio'), 'usePortfolio').mockReturnValue(
                mockPortfolio
            );

            render(
                <PortfolioCashBalance accountId={mockActiveAccount.id} />
            );

            expect(screen.getByText('Cash Balance')).toBeInTheDocument();
            expect(screen.getByText(`${mockPortfolio.currencyCode} ${mockPortfolio.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)).toBeInTheDocument();
            expect(screen.getByText('Available for trading')).toBeInTheDocument();
        });
    });
})