import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TradeConfirmModal from '@/components/TradeConfirmModal';

describe('TradeConfirmModal', () => {
    const defaultProps = {
        side: 'buy' as const,
        quantity: 10,
        price: 150,
        orderType: 'market',
        onConfirm: jest.fn(),
        onCancel: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly for a buy order', () => {
        render(<TradeConfirmModal {...defaultProps} />);

        expect(screen.getByRole('heading', { name: /confirm buy/i } )).toBeInTheDocument();

        expect(screen.getByText('market')).toBeInTheDocument();
        expect(screen.getByText('10 units')).toBeInTheDocument();

        expect(screen.getByText('150.00')).toBeInTheDocument();
        expect(screen.getByText('1500.00')).toBeInTheDocument();

        const confirmButton = screen.getByRole('button', { name: /confirm/i });
        expect(confirmButton).toHaveClass('bg-[var(--green)]');
    });

    it('renders correctly for a sell order', () => {
        render(<TradeConfirmModal {...defaultProps} side="sell" />);

        expect(screen.getByRole('heading', { name: /confirm sell/i })).toBeInTheDocument();

        const confirmButton = screen.getByRole('button', {name: /confirm/i });
        expect(confirmButton).toHaveClass('bg-[#d4262d]');
    });

    it('calculates total using limitPrice when the order detail in limit', () => {
        render(
            <TradeConfirmModal
                {...defaultProps}
                orderType="limit"
                price={150}
                limitPrice={140}
            />
        );

        expect(screen.getAllByText('140.00')).toHaveLength(2);
        expect(screen.getByText('1400.00')).toBeInTheDocument();

        expect(screen.getByText('Limit Price:')).toBeInTheDocument();
    });

    it('falls back to price if orderType is "limit" but the limit price is undefined', () => {
        render(
            <TradeConfirmModal
                {...defaultProps}
                orderType="limit"
                limitPrice={undefined}
            />
        );

        expect(screen.getByText('150.00')).toBeInTheDocument();
        expect(screen.getByText('1500.00')).toBeInTheDocument();
        expect(screen.queryByText('Limit Price:')).not.toBeInTheDocument();
    });

    it('calls onConfirm when the confirm button is clicked', async () => {
        const user = userEvent.setup();
        render(<TradeConfirmModal {...defaultProps} />);

        const confirmButton = screen.getByRole('button', { name: /confirm/i } );
        await user.click(confirmButton);

        expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
        expect(defaultProps.onCancel).not.toHaveBeenCalled();
    });

    it('calls onCancel when the canel button is click', async () => {
        const user = userEvent.setup();
        render(<TradeConfirmModal {...defaultProps} />);

        const cancelButton = screen.getByRole('button', { name: /cancel/i } );
        await user.click(cancelButton);

        expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
        expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });
});