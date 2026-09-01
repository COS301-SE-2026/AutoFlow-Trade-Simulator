import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BuySellForm from '@/components/BuySellForm';

describe('BuySellForm', () => {
    const mockOnBuy = jest.fn();
    const mockOnSell = jest.fn();

    const defaultProps = {
        price: 100,
        accountBalance: 12000,
        currentHoldings: 5,
        onBuy: mockOnBuy,
        onSell: mockOnSell
    };

    beforeEach(() => {
        jest.clearAllMocks();
    })

    describe('Basic Rendering', () => {
        it('should show the buy and sell form buttons', () => {
            render(<BuySellForm {...defaultProps} />);
            expect(screen.getByRole('button', { name: 'Buy' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Sell' })).toBeInTheDocument();
        });

        it('should show account information', () => {
            render(<BuySellForm {...defaultProps} />);
            expect(screen.getByText('12000.0000')).toBeInTheDocument();
            expect(screen.getByText('5 units')).toBeInTheDocument();
        });

        it('should start in with quantity empty', () => {
            render(<BuySellForm {...defaultProps} />);
            
            const input = screen.getByPlaceholderText('Enter Quantity');
            expect(input).toHaveValue('');
        });
    });

    describe('User interaction', () => {
        it('should let a user enter a quantity', () => {
            render(<BuySellForm {...defaultProps} />);

            const input = screen.getByPlaceholderText('Enter Quantity');
            fireEvent.change(input, { target: { value: '5' } });

            expect(input).toHaveValue('5');
        });

        it('should calculate and show total cost', () => {
            render(<BuySellForm {...defaultProps} />);
            
            const input = screen.getByPlaceholderText('Enter Quantity');
            fireEvent.change(input, {target: { value: '5' } });
            
            expect(screen.getByText('500.00')).toBeInTheDocument();
        });

        it('should enable Buy and Sell buttons only when quantity is positive', () => {
            render(<BuySellForm {...defaultProps} />);
            const buyBtn = screen.getByRole('button', { name: 'Buy' });
            const sellBtn = screen.getByRole('button', { name: 'Sell' });

            expect(buyBtn).toBeDisabled();
            expect(sellBtn).toBeDisabled();

            const input = screen.getByPlaceholderText('Enter Quantity');
            fireEvent.change(input, { target: { value: '3' } });

            expect(buyBtn).toBeEnabled();
            expect(sellBtn).toBeEnabled();
        });
    });

    describe('Trade Execution', () => {
        it('should show confirmation before buying', async () => {
            render(<BuySellForm {...defaultProps} />);
    
            const input = screen.getByPlaceholderText('Enter Quantity');
            fireEvent.change(input, { target: { value: '10' } });
            fireEvent.click(screen.getByRole('button', { name: 'Buy' }));
    
            await waitFor(() => {
                expect(screen.getByText('Confirm Buy')).toBeInTheDocument();
            });
        });

        it('should show confirmation before selling', async () => {
            render(<BuySellForm {...defaultProps} />);

            const input = screen.getByPlaceholderText('Enter Quantity');
            fireEvent.change(input, { target: { value: '3' } });
    
            fireEvent.click(screen.getByRole('button', { name: 'Sell' }));
    
            await waitFor(() => {
                expect(screen.getByText('Confirm Sell')).toBeInTheDocument();
            });
        });

        it('should execute buy when confirmed', async () => {
            render(<BuySellForm {...defaultProps} />);

            const input = screen.getByPlaceholderText('Enter Quantity');
            fireEvent.change(input, { target: { value: '10' } });
            
            fireEvent.click(screen.getByRole('button', { name: 'Buy' }));

            await waitFor(() => {
                expect(screen.getByText('Confirm Buy')).toBeInTheDocument();
            });

            const confirmButton = screen.getByText('Confirm');
            fireEvent.click(confirmButton);

            await waitFor(() => {
                expect(mockOnBuy).toHaveBeenCalledWith(10);
            });
        });

        it('should execute sell when confirmed', async () => {
            render(<BuySellForm {...defaultProps} />);

            const input = screen.getByPlaceholderText('Enter Quantity');
            fireEvent.change(input, { target: { value: '3' } });

            fireEvent.click(screen.getByRole('button', { name: 'Sell' }));
            
            await waitFor(() => {
                expect(screen.getByText('Confirm Sell')).toBeInTheDocument();
            });

            const confirmButton = screen.getByText('Confirm');
            fireEvent.click(confirmButton);

            await waitFor(() => {
                expect(mockOnSell).toHaveBeenCalledWith(3);
            });
        });

        it('should cancel trade when cancel is clicked', async () => {
            render(<BuySellForm {...defaultProps} />);

            const input = screen.getByPlaceholderText('Enter Quantity');
            fireEvent.change(input, { target: { value: '10' } });
            fireEvent.click(screen.getByRole('button', { name: 'Buy' }));

            await waitFor(() => {
                expect(screen.getByText('Confirm Buy')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Cancel'));

            await waitFor(() => {
                expect(screen.queryByText('Confirm Buy')).not.toBeInTheDocument();
                expect(mockOnBuy).not.toHaveBeenCalled();
            });
        });

        it('should reset form after successful trade', async () => {
            render(<BuySellForm {...defaultProps} />);

            const input = screen.getByPlaceholderText('Enter Quantity');
            fireEvent.change(input, { target: { value: '10' } });
            fireEvent.click(screen.getByRole('button', { name: 'Buy' }));

            await waitFor(() => {
                expect(screen.getByText('Confirm Buy')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Confirm'));

            await waitFor(() => {
                expect(input).toHaveValue('');
            })
        })
    });
})