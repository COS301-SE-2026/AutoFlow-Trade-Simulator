import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TickerSearch } from '@/components/TickerSearch';
import { useRealTimeTicks, useRealTimeTicksList } from '@/hooks/useRealTimeTicks';
import { RealTimeTickSchema } from '@/lib/types/assets';

global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

jest.mock('@/hooks/useRealTimeTicks', () => ({
    useRealTimeTicksList: jest.fn()
}));

const mockUseRealTimeTicksList = useRealTimeTicksList as jest.Mock;

describe('TickerSearch', () => {
    const mockTickers = ['AAPL', 'AMZN', 'GOOGL', 'MSFT', 'TSLA'];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders loading state when the hook is loading', () => {
        mockUseRealTimeTicksList.mockReturnValue({
            realTimeTicksList: [],
            loading: true,
            error: null
        });

        render(<TickerSearch />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders error state when hook returns error', () => {
        mockUseRealTimeTicksList.mockReturnValue({
            realTimeTicksList: [],
            loading: false,
            error: new Error('failed to fetch')
        });

        render(<TickerSearch />);
        expect(screen.getByText('Error loading tickers')).toBeInTheDocument();
    });

    it('renders the combobox input with placeholder', () => {
        mockUseRealTimeTicksList.mockReturnValue({
            realTimeTicksList: mockTickers,
            loading: false,
            error: null
        })

        render(<TickerSearch placeholder='Search stocks...'/>)

        const input = screen.getByRole('combobox');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('placeholder', 'Search stocks...');
    });

    it('shows no suggestion when search query is empty', () => {
        mockUseRealTimeTicksList.mockReturnValue({
            realTimeTicksList: mockTickers,
            loading: false,
            error: null
        });

        render(<TickerSearch />);
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('filters tickers based on query when lowercase input input is typed', async () => {
        const user = userEvent.setup();
        mockUseRealTimeTicksList.mockReturnValue({
          realTimeTicksList: mockTickers,
          loading: false,
          error: null
        });

        render(<TickerSearch />);
        const input = screen.getByRole('combobox');
        
        await user.type(input, 'a');

        expect(input).toHaveValue('a');

        const options = await screen.findAllByRole('option');
        const optionTexts = options.map((opt) => opt.textContent);

        expect(optionTexts).toContain('AAPL');
        expect(optionTexts).toContain('AMZN');
        expect(optionTexts).not.toContain('MSFT');
    });

    it('calls onSelect callback when an option is selected', async () => {
        const user = userEvent.setup();
        const handleSelectMock = jest.fn();

        mockUseRealTimeTicksList.mockReturnValue({
            realTimeTicksList: mockTickers,
            loading: false,
            error: null
        });

        render(<TickerSearch onSelect={handleSelectMock}/>);
        const input = screen.getByRole('combobox');

        await user.type(input, 'AAPL');

        const option = await screen.findByRole('option', { name: 'AAPL'});
        await user.click(option);

        expect(handleSelectMock).toHaveBeenCalledTimes(1);
        expect(handleSelectMock).toHaveBeenCalledWith('AAPL');
    });
});