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

    describe('Basic Rendering', () => {
        it('should show the buy and sell form buttons', () => {
            render(<BuySellForm {...defaultProps} />);
            expect(screen.getByText('Buy')).toBeInTheDocument();
            expect(screen.getByText('Sell')).toBeInTheDocument();
        });

        it('should show account information', () => {
            render(<BuySellForm {...defaultProps} />);
            expect(screen.getByText('12000.00')).toBeInTheDocument();
            expect(screen.getByText('5.0000 units')).toBeInTheDocument();
        });

        it('should start in buy mode', () => {
            render(<BuySellForm {...defaultProps} />);
            
            const submitButton = screen.getByRole('button', { name: /Buy/i});
            expect(submitButton).toBeInTheDocument();
        });
    });

    describe('User interaction', () => {
        it('should let a user enter a quantity', () => {
            render(<BuySellForm {...defaultProps} />);

            const input = screen.getByPlaceholderText('Enter Quantity');
            fireEvent.change(input, { target: { value: '5' } });

            expect(input).toHaveValue('5');
        });

        it('should switch between buy and sell mode', () => {
            render(<BuySellForm {...defaultProps} />);

            fireEvent.click(screen.getByText('Sell'));

            const submitButton = screen.getByRole('button', { name: /Sell/i});
            expect(submitButton).toBeInTheDocument();
        });

        it('should calculate and show total cost', () => {
            render(<BuySellForm {...defaultProps} />);
            
            const input = screen.getByPlaceholderText('Enter Quantity');
            fireEvent.change(input, {target: { value: '5' } });
            
            expect(screen.getByText('500.00')).toBeInTheDocument();
        });

        it('should set max quantity when MAX button is clicked', () => {
            render(<BuySellForm {...defaultProps} />);
            
            fireEvent.click(screen.getByText('MAX'));
            const input = screen.getByPlaceholderText('Enter Quantity');
            expect(input).toHaveValue('120');
        });
    });

    describe('Validation', () => {
        it('should not allow buying more than you can afford', () => {
            render(<BuySellForm {...defaultProps} />);
            
            const input = screen.getByPlaceholderText('Enter Quantity');
            fireEvent.change(input, { target: { value: '200' } });
            
            expect(screen.getByText('Insufficient Balance')).toBeInTheDocument();
        });

        it('should not allow selling more than you own', () => {
            render(<BuySellForm {...defaultProps} />);

            fireEvent.click(screen.getByText('Sell'));
            const input = screen.getByPlaceholderText('Enter Quantity');
            fireEvent.change(input, { target: { value: '100'} });

            expect(screen.getByText('Insufficient holdings')).toBeInTheDocument();
        });

        it('should disable submit button when quantity is 0', () => {
            render(<BuySellForm {...defaultProps} />);

            const submitButton = screen.getByRole('button', { name: /Buy 0 units/i});
            expect(submitButton).toBeDisabled();
        });
    });

    describe('Trade Execution', () => {
        it('should show confirmation before buying', async () => {
            render(<BuySellForm {...defaultProps} />);
    
            const input = screen.getByPlaceholderText('Enter Quantity');
            fireEvent.change(input, { target: { value: '10' } });
            fireEvent.click(screen.getByRole('button', { name: /Buy 10 units/i }));
    
            await waitFor(() => {
                expect(screen.getByText('Confirm Purchase')).toBeInTheDocument();
            });
        });

        it('should execute buy when confirmed', async () => {
            render(<BuySellForm {...defaultProps} />);
            
            const input = screen.getByPlaceholderText('Enter Quantity');
            fireEvent.change(input, { target: { value: '10' } });
            fireEvent.click(screen.getByRole('button', { name: /Buy 10  units/i }));

            await waitFor(() => {
                expect(screen.getByText('Confirm Purchase')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Confirm Buy'));

            await waitFor(() => {
                expect(mockOnBuy).toHaveBeenCalledWith(10, 'market', undefined);
            });
        });
    });
})