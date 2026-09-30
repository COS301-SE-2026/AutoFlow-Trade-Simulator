import { render, screen } from '@testing-library/react';
import AssetSummaryBar from '@/components/AssetSummaryBar';
import { useAssetSummary } from '@/hooks/useAssetSummary';

jest.mock('@/hooks/useAssetSummary')
const mockUseAssetSummary = useAssetSummary as jest.MockedFunction<typeof useAssetSummary>;

jest.mock('@/components/charts/priceChart', () => {
    return function MockPriceChart({ ticker }: {ticker: string}) {
        return <div data-testid="price-chart">A or some price chart for a {ticker}</div>
    }
});

describe('AssetSummaryBar', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders loading state when hook is fetching data', () => {
        mockUseAssetSummary.mockReturnValue({
            data: null,
            loading: true,
            error: null
        } as any);

        render(<AssetSummaryBar ticker="AAPL"/>);

        expect(screen.getByText('Loading summary...')).toBeInTheDocument();
    });

    it('renders data correctly with a positive day change', () => {
        mockUseAssetSummary.mockReturnValue({
            data: {
                ticker: 'AAPL',
                current_price: 150.0,
                open_price: 140.0,
                daily_high: 155.0,
                daily_low: 138.0
            },
            loading:false,
            error: null
        }as any);

        render(<AssetSummaryBar ticker="AAPL"/>);

        expect(screen.getByText('AAPL')).toBeInTheDocument();
        expect(screen.getByText('150.00')).toBeInTheDocument();
        expect(screen.getByText('155.00')).toBeInTheDocument();
        expect(screen.getByText('138.00')).toBeInTheDocument();

        const changeText = screen.getByText('+7.14% today');
        expect(changeText).toBeInTheDocument();
        expect(changeText).toHaveClass('text-green-600');
    });

    it('renders negative day change', () => {
        mockUseAssetSummary.mockReturnValue({
            data: {
                ticker: 'AAPL',
                current_price: 180.0,
                open_price: 200.0,
                daily_high: 205.0,
                daily_low: 175.0
            },
            loading:false,
            error: null
        }as any);

        render(<AssetSummaryBar ticker="AAPL"/>);

        expect(screen.getByText('AAPL')).toBeInTheDocument();
        expect(screen.getByText('180.00')).toBeInTheDocument();
        expect(screen.getByText('205.00')).toBeInTheDocument();
        expect(screen.getByText('175.00')).toBeInTheDocument();

        const changeText = screen.getByText('-10.00% today');
        expect(changeText).toBeInTheDocument();
        expect(changeText).toHaveClass('text-red-600');
    });

    it('renders holding details when holding prop is provided', () => {
        mockUseAssetSummary.mockReturnValue({
            data:{
                ticker: "AAPL",
                current_price: 150.0,
                open_price: 145.0,
                daily_high: 152.0,
                daily_low: 144.0
            },
            loading: false,
            error: null
        } as any);

        const mockHolding = {
            ticker: 'AAPL',
            net_quantity: 10,
            average_cost: 120.5,
            current_price: 150.0
        };

        render(<AssetSummaryBar ticker="AAPL" holding={mockHolding as any}/>);

        expect(screen.getByText('Shares Owned')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();

        expect(screen.getByText('120.50')).toBeInTheDocument();
        expect(screen.getByText('1,500.00')).toBeInTheDocument();
    });

    it('does not render the holding section if the holding prop does not exist or is null', () => {
        mockUseAssetSummary.mockReturnValue({
            data: {
                ticker: 'AAPL',
                current_price: 150.0,
                open_price: 145.0,
                daily_high: 152.0,
                daily_low: 144.0
            },
            loading: false,
            error: null
        } as any);

        render(<AssetSummaryBar ticker="AAPL" holding={null}/>);

        expect(screen.queryByText('Shares Owned')).not.toBeInTheDocument();
        expect(screen.queryByText('Avg. Cost')).not.toBeInTheDocument();
    });

    it('passes the ticker prop to  the price chart', () => {
        mockUseAssetSummary.mockReturnValue({
            data: null,
            loading: false,
            error: null
        } as any);

        render(<AssetSummaryBar ticker="AAPL" />);

        expect(screen.getByTestId('price-chart')).toHaveTextContent('A or some price chart for a AAPL')
    });
})