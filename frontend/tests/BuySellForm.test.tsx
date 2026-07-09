import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BuySellForm from '@/components/BuySellForm';

describe('BuySellForm', () => {
    const mockOnBuy = jest.fn();
    const mockOnSell = jest.fn();

    const defaultProps = {
        price: 100,
        accountBalance: 12000,
        currentHoldings: 5,
        onBuy: mockOnBuy(),
        onSell: mockOnSell()
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

        it('should start in buy mode', () => {
            render(<BuySellForm {...defaultProps} />);
            
            const submitButton = screen.getByRole('button', { name: /Buy/i});
            expect(submitButton).toBeInTheDocument();
        });
    });
})