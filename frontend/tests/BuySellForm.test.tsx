import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event'
import BuySellForm from '@/components/BuySellForm';
import { Target } from 'lucide-react';

jest.mock('@/components/TradeConfirmModal', () => {
    return function DummyTradeConfirmModal({
        side,
        quantity,
        price,
        onConfirm,
        onCancel,
    }: any) {
        return (
            <div data-testid="trade-confirm-modal">
                <span>Modal Side: {side} </span>
                <span>Modal Qty: {quantity} </span>
                <span>Modal Price: {price} </span>
                <button onClick={onConfirm}>  Confirm Modal </button>
                <button onClick={onCancel}> Cancel Modal </button>
            </div>
        )
    }
});

describe ('BuySellForm', () => {
    const mockOnBuy = jest.fn();
    const mockOnSell = jest.fn();

    const defaultProps = {
        price: 100,
        accountBalance: 12000,
        currentHoldings: 5,
        onBuy: mockOnBuy,
        onSell: mockOnSell
    }

    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Becase ik im going to start loosing track of where the tests are time to leave so comments
    //This is the basic account information test
    it('rendering initial account informmation', () => {
        render(<BuySellForm {...defaultProps}/>)

        expect(screen.getByText('Available Balance')).toBeInTheDocument();
        expect(screen.getByText('12000.0000')).toBeInTheDocument();
        expect(screen.getByText('5 units')).toBeInTheDocument();
        expect(screen.getByText('100.00')).toBeInTheDocument();

        expect(screen.getByRole('button', { name: /^buy$/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /^sell$/i })).toBeDisabled();
    });

    //This test will be testing the inputs
    it('Testing inputs and the assocaited validation', async () => {
        const user = userEvent.setup();
        render(<BuySellForm {...defaultProps}/>);

        const qtyInput = screen.getByPlaceholderText('Enter Quantity') as HTMLInputElement;

        await user.type(qtyInput, 'abc');
        expect(qtyInput.value).toBe('');

        await user.clear(qtyInput);

        await user.type(qtyInput, '5');
        expect(qtyInput.value).toBe('5');
        expect(screen.getByText('500.00')).toBeInTheDocument()

        await user.clear(qtyInput);

        fireEvent.change(qtyInput, { target: {value: '5.11'} })
        expect(qtyInput.value).toBe('5.11');

        expect(screen.getByText('511.00')).toBeInTheDocument();
    });

    // Button enabling
    it('enable buy and sell button when qty > 0', async () => {
        const user = userEvent.setup();
        render(<BuySellForm {...defaultProps} />);

        const qtyInput = screen.getByPlaceholderText('Enter Quantity');
        const buyBtn = screen.getByRole('button', { name: /^buy$/i });
        const sellBtn = screen.getByRole('button', { name: /^sell$/i });

        expect(buyBtn).toBeDisabled();
        expect(sellBtn).toBeDisabled();

        await user.type(qtyInput, '5');

        expect(buyBtn).not.toBeDisabled();
        expect(sellBtn).not.toBeDisabled();
    });

    // Buy interaction
    it('Going through opening buy modal and caling onBuy upon confirmation', async () => {
        const user = userEvent.setup();
        render(<BuySellForm {...defaultProps}/>);

        await user.type(screen.getByPlaceholderText('Enter Quantity'), '3');
        await user.click(screen.getByRole('button', { name: /^buy$/i}));

        expect(screen.getByTestId('trade-confirm-modal')).toBeInTheDocument();
        expect(screen.getByText('Modal Side: buy')).toBeInTheDocument();
        expect(screen.getByText('Modal Qty: 3')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /confirm modal/i }));

        expect(defaultProps.onBuy).toHaveBeenCalledWith(3);
        expect(defaultProps.onBuy).toHaveBeenCalledTimes(1);

        expect(screen.queryByTestId('trade-confirm-modal')).not.toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter Quantity')).toHaveValue('');
    });

    // Sell interaction
    it('Going through opening sell modal and caling onSell upon confirmation', async () => {
        const user = userEvent.setup();
        render(<BuySellForm {...defaultProps}/>);

        await user.type(screen.getByPlaceholderText('Enter Quantity'), '3');
        await user.click(screen.getByRole('button', { name: /^sell$/i}));

        expect(screen.getByTestId('trade-confirm-modal')).toBeInTheDocument();
        expect(screen.getByText('Modal Side: sell')).toBeInTheDocument();
        expect(screen.getByText('Modal Qty: 3')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /confirm modal/i }));

        expect(defaultProps.onSell).toHaveBeenCalledWith(3);
        expect(defaultProps.onSell).toHaveBeenCalledTimes(1);

        expect(screen.queryByTestId('trade-confirm-modal')).not.toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter Quantity')).toHaveValue('');
    });

    //Cacel modal flow
    it('User cancels their transaction', async () => {
        const user = userEvent.setup();
        render(<BuySellForm {...defaultProps}/>);

        await user.type(screen.getByPlaceholderText('Enter Quantity'), '4');
        await user.click(screen.getByRole('button', { name: /^buy$/i }));

        expect(screen.getByTestId('trade-confirm-modal')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /cancel modal/i }));

        expect(screen.queryByTestId('trade-confirm-modal')).not.toBeInTheDocument();
        expect(defaultProps.onBuy).not.toHaveBeenCalled();
        expect(defaultProps.onSell).not.toHaveBeenCalled();
    });
  
});