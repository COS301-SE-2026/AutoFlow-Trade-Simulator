import '@testing-library/jest-dom';

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

})