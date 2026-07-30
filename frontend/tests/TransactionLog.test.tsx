import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { TransactionLog } from '@/components/TransactionLog';

import { useAccount } from '@/lib/hooks/accountContext';

jest.mock('@/lib/hooks/accountContext', () => ({
    useAccount: jest.fn()
}))

const mockUseAccount = useAccount as jest.MockedFunction<typeof useAccount>;

const mockActiveAccount = {
    id: 1,
    portfolio_id: 1,
    currency_id: 1,
    currency_code: 'ZAR',
    balance: '100.00',
    created_at: new Date(),
}

const mockTransactions = [
    {
        "account_id": 1,
        "account_currency_code": "string",
        "asset_ticker": "AAPL",
        "asset_id": 0,
        "direction": "sell",
        "quantity": 0,
        "price_at_execution": 0,
        "executed_at": "2026-07-30T13:20:30.890Z"
    },
    {
        "account_id": 1,
        "account_currency_code": "string",
        "asset_ticker": "GOOGL",
        "asset_id": 1,
        "direction": "buy",
        "quantity": 0,
        "price_at_execution": 0,
        "executed_at": "2026-07-30T13:20:30.890Z"
    },
]


const mockOnClose = jest.fn();

jest.mock('@/hooks/useTransactions', () => ({
    useTransactions: () => (mockTransactions),
}))

describe('TransactionLog', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    describe('TransactionLog content present', () => {
        it('renders strategy content', async () => {
            jest.spyOn(require('@/hooks/useTransactions'), 'useTransactions').mockReturnValue({
                transactions: mockTransactions,
                loading: false,
                error: null,
            });

            render(
                <TransactionLog accountId={mockActiveAccount.id} />
            );

            expect(screen.getByText('AAPL')).toBeInTheDocument();
            expect(screen.getByText('GOOGL')).toBeInTheDocument();
        });

        it('shows loading state', async () => {
            jest.spyOn(require('@/hooks/useTransactions'), 'useTransactions').mockReturnValue({
                transactions: [],
                loading: true,
                error: null,
            });

            render(
                <TransactionLog accountId={mockActiveAccount.id} />
            );

            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });

    });

    describe('filter functionality', () => {
        it('ticker filter', async () => {
            jest.spyOn(require('@/hooks/useTransactions'), 'useTransactions').mockReturnValue({
                transactions: mockTransactions,
                loading: false,
                error: null,
            });

            render(
                <TransactionLog accountId={mockActiveAccount.id} />
            );

            expect(screen.queryByText('AAPL')).toBeInTheDocument();
            expect(screen.queryByText('GOOGL')).toBeInTheDocument();

            const searchInput = screen.getByPlaceholderText('Search by ticker...');
            fireEvent.change(searchInput, { target: { value: 'AAPL' } });

            expect(screen.queryByText('AAPL')).toBeInTheDocument();
            expect(screen.queryByText('GOOGL')).not.toBeInTheDocument();
        });
    });
})