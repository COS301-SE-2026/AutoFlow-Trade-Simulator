import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PriceChart from '@/components/charts/priceChart';
import { usePrices } from '@/hooks/usePrices';
import { CartesianGrid, ResponsiveContainer, XAxis } from 'recharts';
import { Children } from 'react';

jest.mock('@/hooks/usePrices');

jest.mock('recharts', () => {
    const originalModule = jest.requireActual('recharts');
    return{
        ...originalModule,
        ResponsiveContainer: ( { children } : { children: React.ReactNode }) => (
            <div data-testid="responsive-container">{children}</div>
        ),
        LineChart: ({ children } : { children: React.ReactNode }) => (
            <div data-testid="line-chart">{children}</div>
        ),
        Line: () => <div data-testid="line"/>,
        XAxis: () => <div data-testid="x-axis"/>,
        YAxis: () => <div data-testid="y-axis"/>,
        CartesianGrid: () => <div data-testid="cartesian-grid"/>,
        Tooltip: ({ content } : { content: React.ReactElement} ) => {
            return <div data-testid="tooltip-wrapper">{content}</div>
        },
        Legend: () => <div data-testid="legend"/>
    }
});

describe('PriceChart Component', () => {
    const mockUsePrices = usePrices as jest.Mock;

    const sampleData = [
        {
        timestamp: '2026-09-01T10:00:00Z',
        open: 150.123,
        high: 155.456,
        low: 148.789,
        close: 152.321,
        },
        {
        timestamp: '2026-09-02T10:00:00Z',
        open: 152.0,
        high: 160.0,
        low: 151.5,
        close: 158.9,
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Loading and Rendering States', () => {
        it('renders Chartskeleton when loading is of value true', () => {
            mockUsePrices.mockReturnValue({
                data: [],
                loading: true,
                error: null
            });

            render(<PriceChart ticker="AAPL"/>);

            expect(screen.getByText('Loading...')).toBeInTheDocument();
            expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
        });

        it('renders LineChart and UI controls when loading is false', () => {
            mockUsePrices.mockReturnValue({
                data: sampleData,
                loading: false,
                error: null
            });

            render(<PriceChart ticker="AAPL"/>);

            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            expect(screen.getByText('Select Chart Timeframe:')).toBeInTheDocument();
            expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        });

        it('handles empty data gracefully without throwing', () => {
            mockUsePrices.mockReturnValue({
                data: [],
                loading: false,
                error: null
            });

            render(<PriceChart ticker="AAPL" />);

            expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        });
    });

    describe('Timeframe Interactivity', () => {
        it('defaults to daily timeframe ("1d")', () => {
            mockUsePrices.mockReturnValue({
                data: sampleData,
                loading: false,
                error: null
            });

            render(<PriceChart ticker="TSLA" />);

            expect(mockUsePrices).toHaveBeenCalledWith('TSLA', '1d');
        });

        it('updates timeframe state and calls usePrices with "1w"', () => {
            mockUsePrices.mockReturnValue({
                data: sampleData,
                loading: false,
                error: null
            })

            render(<PriceChart ticker="TSLA"/>);

            const weekBtn = screen.getByRole('button', { name: /Weekly/i } );
            fireEvent.click(weekBtn);

            expect(mockUsePrices).toHaveBeenLastCalledWith('TSLA', '1w');
        });

        it('updates timeframe state and calls usePrices with "1m"', () => {
            mockUsePrices.mockReturnValue({
                data: sampleData,
                loading: false,
                error: null
            });

            render(<PriceChart ticker="TSLA"/>);

            const monthBtn = screen.getByRole('button', { name: /Monthly/i });
            fireEvent.click(monthBtn);

            expect(mockUsePrices).toHaveBeenLastCalledWith('TSLA', '1m');
        });

        it('switches back to Daily ("1d") when Daily button is clicked', () => {
            mockUsePrices.mockReturnValue({
                data: sampleData,
                loading: false,
                error: null
            });

            render(<PriceChart ticker="TSLA"/>);

            fireEvent.click(screen.getByRole('button', { name: /Weekly/i }));
            fireEvent.click(screen.getByRole('button', { name: /Daily/i } ));

            expect(mockUsePrices).toHaveBeenLastCalledWith('TSLA', '1d');
        });

        describe('Tooltip Component', () => {
            it('renders formatted tooltip values whilst active with a payload (valid)', () => {
                mockUsePrices.mockReturnValue({
                    data: sampleData,
                    loading: false,
                    error: null
                });

                const { container } = render(<PriceChart ticker="AAPL"/>);
                const ToolTipWrapper = screen.getByTestId('tooltip-wrapper');

                const CustomTooltipElement = (PriceChart as any);
                expect(ToolTipWrapper).toBeInTheDocument();
            })
        });
    });
});