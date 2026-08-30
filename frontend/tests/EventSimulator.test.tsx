import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventSimulator } from '@/components/EventSimulator';
import { startSimulation } from '@/lib/api/assets';
import { apiClient } from '@/lib/api';
import { ResponsiveContainer } from 'recharts';
import { promise } from 'zod/v4';

beforeAll(() => {
    global.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
});

jest.mock('@/lib/api/assets', () => ({
    startSimulation: jest.fn()
}));

jest.mock('@/lib/api', () => ({
    apiClient: jest.fn()
}));

jest.mock('@components/news/newsScroll', () => ({
    NewsTicker: ({ items }: any) => (
        <div data-testid="news-ticker-mock">
            News Items: {items ? items.length : 0}
        </div>
    )
}));

jest.mock('@/components/TradeConfirmModal', () => {
    return function DummyTradeConfirmModal({ side, quantity, price, onConfirm, onCancel }: any) {
        return (
            <div data-testid="trade-confirm-modal">
                <span>Side: {side}</span>
                <span>Qty: {quantity}</span>
                <span>Price: {price}</span>
                <button onClick={onConfirm}>Confirm Trade</button>
                <button onClick={onCancel}>Cancel Trade</button>
            </div>
        );
    };
});

jest.mock('recharts', () => {
    const OrginalModule = jest.requireActual('recharts');
    return {
        ...OrginalModule,
        ResponsiveContainer: ({ children }: any) => (
            <div style={{ width: 800, height: 400}}>{children}</div>
        )
    };
});

describe('EventSimulator Component', () => {
    const mockOnBack = jest.fn();

    const mockEvent = {
        id: 'evt-1',
        title: 'Tech Crash 2008',
        ticker: 'AAPL',
        company: 'Apple Inc',
        sector: 'Technology',
        period: '2008',
        narrative: 'Market downturn simulation',
        context: 'Historical crash context',
        timeframe: '1y',
        startYear: 2008,
        startMonth: 1,
        startDay: 1,
        tradingDay: 1,
        tradingDays: 10,
        initialBalance: 10000
    };

    const mockSimCreateResponse = {
        simulation_id: 101,
        bars: {
            APPL: [
                { close: 100, timestamp: '2008-01-01T00:00:00z'},
                { close: 105, timestamp: '2008-01-02T00:00:00z'},
                { close: 110, timestamp: '2008-01-03T00:00:00z'}
            ]
        }
    }

    beforeEach(() => {
        jest.clearAllMocks();
        (startSimulation as jest.Mock).mockResolvedValue(mockSimCreateResponse);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('renders loading state whilst API resolves', () => {
        (startSimulation as jest.Mock).mockReturnValue(new Promise(() => {}));
        render(<EventSimulator event={mockEvent} onBack={mockOnBack}/>);
        expect(screen.getByText(/Loading simulation.../i)).toBeInTheDocument();
    });

    it('Initialize and renders simulation interface correctly' ,async () => {
        render(<EventSimulator event={mockEvent} onBack={mockOnBack}/>);

        await waitFor(() => {
            expect(screen.getAllByTestId('AAPL')[0]).toBeInTheDocument();
            expect(screen.getByText('Tech Crash 2008')).toBeInTheDocument();
        });

        expect(screen.getByText('R 10000.00')).toBeInTheDocument();
        expect(screen.getByText('COST: R100.00')).toBeInTheDocument();
    });

    it('triggers back button handler when clicked', async () => {

        await waitFor(() => {
            expect(screen.getByText('Back')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Back'));
        expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('toggles playback using play/pause buttons', async () => {
        jest.useFakeTimers();
        render(<EventSimulator event={mockEvent} onBack={mockOnBack} /> );

        await act(async () => {
            await Promise.resolve();
        });

        const playBtn = await screen.findByRole('button', { name: /^Play$/i});
        fireEvent.click(playBtn);

        expect(screen.getByRole('button', {name : /^Pause$/i})).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(2000);
        });

        expect(screen.getByText('COST: R105.00')).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(2000);
        });

        expect(screen.getByText('COST: R105.00')).toBeInTheDocument();
    });

    it('Tests clicking the Skip foward button and index incrementing accordingly', async () => {
        render(<EventSimulator event={mockEvent} onBack={mockOnBack}/>);

        await waitFor(() => {
            expect(screen.getByText('Skip Foward')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Skip Foward'));
        expect(screen.getByText('COST: R105.00')).toBeInTheDocument();
    });

    it('Open trade confirmation window and executes a successful BUY order', async () => {
        (apiClient as jest.Mock).mockResolvedValue({
            positions: { AAPL: 2},
            nav: 10000
        });

        render(<EventSimulator event={mockEvent} onBack={mockOnBack}/> );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /^Buy&/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /^Buy$/i }));
        expect(screen.getByTestId('trade-confirm-modal')).toBeInTheDocument();

        await act(async () => {
            fireEvent.click(screen.getByText('Confirm Trade'));
        });

        expect(apiClient).toHaveBeenCalledWith(
            '/simulation/practice/simulate/actions',
            expect.objectContaining({
                method: 'POST',
                body: {
                    simulation_id: 101,
                    actions: [
                        {
                            type: 'buy',
                            symbol: 'AAPL',
                            qty: 1,
                            timestamp: '2008-01-01T00:00:00Z'
                        }
                    ]
                }
            })
        );

        expect(screen.getByText(/BUY 1 @ R100.0/i)).toBeInTheDocument();
    });

    it('handles sell validation when user has zero shares', async () => {
        render(<EventSimulator event={mockEvent} onBack={mockOnBack}/>);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /^Sell$/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /^Sell%/i }));
        fireEvent.click(screen.getByText('Confirm Trade'));

        expect(screen.getByText('You have no share to sell.')).toBeInTheDocument();
    });

    it('renders simulation finish summary upon completion', async () => {
        const mockFinishResponse = {
            simulation_id: 101,
            status: 'finished',
            start_date: '2008-01-01',
            end_date: '2008-01-10',
            initial_balance: '10000.00',
            summary: {
                final_balance: '12500.50',
                returns_pct: '25.01',
                max_drawdown: '3.42',
                trades_count: 4,
                per_symbol_results: {
                    AAPL: { final_value: '12500.50', returns_pct: '25.01' },
                },
            },
        };

        (apiClient as jest.Mock).mockResolvedValue(mockFinishResponse);

        render(<EventSimulator event={mockEvent} onBack={mockOnBack}/>);

        await waitFor(() => {
            expect(screen.getByText('View Simulation Summary')).toBeInTheDocument();
        });

        await act(async () => {
            fireEvent.click(screen.getByText('View Simulation Summary'));
        });

        expect(screen.getByText('Simulation Finished')).toBeInTheDocument();
        expect(screen.getByText('R 12500.00')).toBeInTheDocument();
        expect(screen.getByText('25.01%')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Back to Events/i }));
        expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('handles simulation creation API failure', async () => {
        //Yay console spy is back :D
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        (startSimulation as jest.Mock).mockRejectedValueOnce(new Error('Init failed'));

        render(<EventSimulator event={mockEvent} onBack={mockOnBack}/>);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
                'Failed to create simulation',
                expect.any(Error)
            )
        });

        consoleSpy.mockRestore();
    });

    it('caps sell quantity to max avaialable owned shares', async () => {
        (apiClient as jest.Mock).mockResolvedValue({
            positions: { AAPL: 2},
            nav: 10000
        });

        render(<EventSimulator event={mockEvent} onBack={mockOnBack} />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /^Buy$/i })).toBeInTheDocument();
        });
        fireEvent.click(screen.getByRole('button', { name: /^Buy$/i }));
        await act(async () => {
            fireEvent.click(screen.getByText('Confirm Trade'));
        });

        const qtyInput = screen.getByPlaceholderText('Quantity');
        fireEvent.change(qtyInput, { target: {value: '10'} });

        fireEvent.click(screen.getByRole('button', { name: /^Sell$/i }));
        await act(async () => {
            fireEvent.click(screen.getByText('ConfirmTrade'));
        });

        expect(apiClient).toHaveBeenCalledWith(
            '/simulation/practice/simulate/actions',
            expect.objectContaining({
            body: expect.objectContaining({
                        actions: [
                            expect.objectContaining({
                            type: 'sell',
                            qty: 2,
                        }),
                    ],
                }),
            })
        );
    });

    
});