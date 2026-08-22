import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event'
import BuySellForm from '@/components/BuySellForm';

// describe('BuySellForm', () => {
//     const mockOnBuy = jest.fn();
//     const mockOnSell = jest.fn();

//     const defaultProps = {
//         price: 100,
//         accountBalance: 12000,
//         currentHoldings: 5,
//         onBuy: mockOnBuy,
//         onSell: mockOnSell
//     };

//     beforeEach(() => {
//         jest.clearAllMocks();
//     })

//     describe('Basic Rendering', () => {
//         it('should show the buy and sell form buttons', () => {
//             render(<BuySellForm {...defaultProps} />);
//             expect(screen.getByText('Buy')).toBeInTheDocument();
//             expect(screen.getByText('Sell')).toBeInTheDocument();
//         });

//         it('should show account information', () => {
//             render(<BuySellForm {...defaultProps} />);
//             expect(screen.getByText('12000.00')).toBeInTheDocument();
//             expect(screen.getByText('5.0000 units')).toBeInTheDocument();
//         });

//         it('should start in buy mode', () => {
//             render(<BuySellForm {...defaultProps} />);
            
//             const submitButton = screen.getByRole('button', { name: 'Buy' });
//             expect(submitButton).toBeInTheDocument();
//         });
//     });

//     describe('User interaction', () => {
//         it('should let a user enter a quantity', () => {
//             render(<BuySellForm {...defaultProps} />);

//             const input = screen.getByPlaceholderText('Enter Quantity');
//             fireEvent.change(input, { target: { value: '5' } });

//             expect(input).toHaveValue('5');
//         });

//         it('should switch between buy and sell mode', () => {
//             render(<BuySellForm {...defaultProps} />);

//             fireEvent.click(screen.getByRole('button', { name: 'Sell' }));

//             const submitButton = screen.getByRole('button', { name: 'Sell' });
//             expect(submitButton).toBeInTheDocument();
//         });

//         it('should calculate and show total cost', () => {
//             render(<BuySellForm {...defaultProps} />);
            
//             const input = screen.getByPlaceholderText('Enter Quantity');
//             fireEvent.change(input, {target: { value: '5' } });
            
//             expect(screen.getByText('500.00')).toBeInTheDocument();
//         });

//         it('should set max quantity when MAX button is clicked', () => {
//             render(<BuySellForm {...defaultProps} />);
            
//             fireEvent.click(screen.getByText('MAX'));
//             const input = screen.getByPlaceholderText('Enter Quantity');
//             expect(input).toHaveValue('120');
//         });
//     });

//     describe('Validation', () => {
//         it('should not allow buying more than you can afford', () => {
//             render(<BuySellForm {...defaultProps} />);
            
//             const input = screen.getByPlaceholderText('Enter Quantity');
//             fireEvent.change(input, { target: { value: '200' } });
            
//             expect(screen.getByText('Insufficient Balance')).toBeInTheDocument();
//         });

//         it('should not allow selling more than you own', () => {
//             render(<BuySellForm {...defaultProps} />);

//             fireEvent.click(screen.getByText('Sell'));
//             const input = screen.getByPlaceholderText('Enter Quantity');
//             fireEvent.change(input, { target: { value: '100'} });

//             expect(screen.getByText('Insufficient holdings')).toBeInTheDocument();
//         });

//         it('should disable submit button when quantity is 0', () => {
//             render(<BuySellForm {...defaultProps} />);

//             const submitButton = screen.getByRole('button', { name: /Buy 0 units/i});
//             expect(submitButton).toBeDisabled();
//         });
//     });

//     describe('Trade Execution', () => {
//         it('should show confirmation before buying', async () => {
//             render(<BuySellForm {...defaultProps} />);
    
//             const input = screen.getByPlaceholderText('Enter Quantity');
//             fireEvent.change(input, { target: { value: '10' } });
//             fireEvent.click(screen.getByRole('button', { name: /Buy 10 units/i }));
    
//             await waitFor(() => {
//                 expect(screen.getByText('Confirm Buy')).toBeInTheDocument();
//             });
//         });

//         it('should show confirmation before selling', async () => {
//             render(<BuySellForm {...defaultProps} />);
    
//             fireEvent.click(screen.getByRole('button', { name: 'Sell' }));

//             const input = screen.getByPlaceholderText('Enter Quantity');
//             fireEvent.change(input, { target: { value: '3' } });
//             fireEvent.click(screen.getByRole('button', { name: /^Sell 3 units/ }));
    
//             await waitFor(() => {
//                 expect(screen.getByText('Confirm Sell')).toBeInTheDocument();
//             });
//         });

//         it('should execute buy when confirmed', async () => {
//             render(<BuySellForm {...defaultProps} />);
            
//             const input = screen.getByPlaceholderText('Enter Quantity');
//             fireEvent.change(input, { target: { value: '10' } });
//             fireEvent.click(screen.getByRole('button', { name: /Buy 10 units/i }));

//             await waitFor(() => {
//                 expect(screen.getByText('Confirm Buy')).toBeInTheDocument();
//             });

//             const confirmButton = screen.getByText('Confirm');
//             fireEvent.click(confirmButton);

//             await waitFor(() => {
//                 expect(mockOnBuy).toHaveBeenCalledWith(10, 'market', undefined);
//             });
//         });

//         it('should execute sell when confirmed', async () => {
//             render(<BuySellForm {...defaultProps} />);

//             fireEvent.click(screen.getByRole('button', { name: 'Sell' }));
            
//             const input = screen.getByPlaceholderText('Enter Quantity');
//             fireEvent.change(input, { target: { value: '3' } });
//             fireEvent.click(screen.getByRole('button', { name: /^Sell 3 units/ }));

//             await waitFor(() => {
//                 expect(screen.getByText('Confirm Sell')).toBeInTheDocument();
//             });

//             const confirmButton = screen.getByText('Confirm');
//             fireEvent.click(confirmButton);

//             await waitFor(() => {
//                 expect(mockOnSell).toHaveBeenCalledWith(3, 'market', undefined);
//             });
//         });

//         it('should cancel trade when cancel is clicked', async () => {
//             render(<BuySellForm {...defaultProps} />);

//             const input = screen.getByPlaceholderText('Enter Quantity');
//             fireEvent.change(input, { target: { value: '10' } });
//             fireEvent.click(screen.getByRole('button', { name: /^Buy 10 units/ }));

//             await waitFor(() => {
//                 expect(screen.getByText('Confirm Buy')).toBeInTheDocument();
//             });

//             fireEvent.click(screen.getByText('Cancel'));

//             await waitFor(() => {
//                 expect(screen.queryByText('Confirm Buy')).not.toBeInTheDocument();
//                 expect(mockOnBuy).not.toHaveBeenCalled();
//             });
//         });

//         it('should reset form after successful trade', async () => {
//             render(<BuySellForm {...defaultProps} />);

//             const input = screen.getByPlaceholderText('Enter Quantity');
//             fireEvent.change(input, { target: { value: '10' } });
//             fireEvent.click(screen.getByRole('button', { name: /^Buy 10 units/ }));

//             await waitFor(() => {
//                 expect(screen.getByText('Confirm Buy')).toBeInTheDocument();
//             });

//             fireEvent.click(screen.getByText('Confirm'));

//             await waitFor(() => {
//                 expect(input).toHaveValue('');
//             })
//         })
//     });
// })

jest.mock('./TradeConfirmModal', () => {
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
                <span onClick={onConfirm}>  Confirm Modal </span>
                <span onClick={onCancel}> Cancel Modal </span>
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

        await user.type(qtyInput, '5');
        expect(qtyInput.value).toBe('5');

        await user.clear(qtyInput);

        await user.type(qtyInput, '12.345');
        expect(qtyInput.value).toBe('12.345');

        expect(screen.getByText('500.00')).toBeInTheDocument();
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
    
});