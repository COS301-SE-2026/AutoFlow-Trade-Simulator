import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HoldingsSummary } from '@/components/HoldingsSummary';
import type { HoldingsWithCurrPrice } from '@/hooks/useHoldings';

const mockHoldings: HoldingsWithCurrPrice[] = [
        {
        asset_id: 1,
        ticker: 'AAPL',
        net_quantity: 10,
        average_cost: 150,
        current_price: 180,
        unrealised_pnl: 300,
    },
    {
        asset_id: 2,
        ticker: 'TSLA',
        net_quantity: 5,
        average_cost: 250,
        current_price: 200,
        unrealised_pnl: -250,
    },
    {
        asset_id: 3,
        ticker: 'MSFT',
        net_quantity: 2,
        average_cost: 300,
        current_price: null,
        unrealised_pnl: null,
    }
];

describe('HoldingsSummary', () => {
    it('renders loading state skeleton items', () => {
        const { container } = render (
            <HoldingsSummary holdings={[]} loading={true} error={null}/>
        );

        expect(screen.getByText('Holdings')).toBeInTheDocument();
        const pulseSkeletons = container.querySelectorAll('.animate-pulse');
        expect(pulseSkeletons.length).toBe(3);
    });

    it('renders error message when error prop is provided', () => {
        render ( <HoldingsSummary holdings={[]} loading={false} error="Failed to load holdings" /> );
        expect(screen.getByText('Failed to load holdings')).toBeInTheDocument();
    });

    it('renders empty message when the holdings array is empty', () => {
        render(<HoldingsSummary holdings={[]} loading={false} error={null} />);
        expect(screen.getByText('No holdings.')).toBeInTheDocument();
    });

    it('renders holdings rows correctly with calculated percentages and prices', () => {
        render(<HoldingsSummary holdings={mockHoldings} loading={false} error={null}/>);

        expect(screen.getByText('AAPL')).toBeInTheDocument();
        expect(screen.getByText('10 shares')).toBeInTheDocument();
        expect(screen.getByText('$180.00')).toBeInTheDocument();
        expect(screen.getByText('+20.00%')).toBeInTheDocument();

        expect(screen.getByText('TSLA')).toBeInTheDocument();
        expect(screen.getByText('5 shares')).toBeInTheDocument();
        expect(screen.getByText('$200.00')).toBeInTheDocument();
        expect(screen.getByText('-20.00%')).toBeInTheDocument();

        expect(screen.getByText('MSFT')).toBeInTheDocument();
        expect(screen.getByText('2 shares')).toBeInTheDocument();
        expect(screen.getByText('No live price')).toBeInTheDocument();
    });

    it('highlights the selected ticker now', () => {
        render(<HoldingsSummary holdings={mockHoldings} loading={false} error={null} selectedTicker="AAPL"/>);

        expect(screen.getByRole('button', { name: /aapl/i })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: /tsla/i})).toHaveAttribute('aria-pressed', 'false');
    });

    it('triggers onSelectAction callback when a holding card is click', () => {
        const handleSelect = jest.fn();

        render(<HoldingsSummary holdings={mockHoldings} loading={false} error={null} onSelectAction={handleSelect}/>);
        fireEvent.click(screen.getByRole('button', { name: /tsla/i }));

        expect(handleSelect).toHaveBeenCalledTimes(1);
        expect(handleSelect).toHaveBeenCalledWith('TSLA');
    });
});