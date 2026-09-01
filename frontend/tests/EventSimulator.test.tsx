import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventSimulator } from '@/components/EventSimulator';
import { startSimulation } from '@/lib/api/assets';
import { apiClient } from '@/lib/api';
import { ResponsiveContainer } from 'recharts';
import { calc_greeks, calc_realized_volatility } from '@/lib/greeks';

jest.mock('@/lib/greeks', () => ({
    calc_greeks: jest.fn(),
    calc_realized_volatility: jest.fn()
}));

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

jest.mock('@/components/news/newsScroll', () => ({
    NewsTicker: ({ items }: any) => (
        <div data-testid="news-ticker-mock">
            News Items: {items ? items.length : 0}
        </div>
    )
}));

jest.mock('@/hooks/useNews', () => ({
    useNews: () => ({
        newsItems: [],
        error: null,
        isLoading: false
    }),
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
            AAPL: [
                { close: 100, timestamp: '2008-01-01T00:00:00Z'},
                { close: 105, timestamp: '2008-01-02T00:00:00Z'},
                { close: 110, timestamp: '2008-01-03T00:00:00Z'}
            ]
        }
    }

    beforeEach(() => {
        jest.clearAllMocks();
        (startSimulation as jest.Mock).mockResolvedValue(mockSimCreateResponse);
        (calc_greeks as jest.Mock).mockReturnValue({ 
            delta: 0.5123, 
            gamma: 0.0234,
            theta: -0.0451,
            vega: 0.1234,
            rho: 0.0567
        });
        (calc_realized_volatility as jest.Mock).mockReturnValue(0.25);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('renders loading state whilst API resolves', async () => {
        (startSimulation as jest.Mock).mockReturnValue(new Promise(() => {}));
        render(<EventSimulator event={mockEvent} onBack={mockOnBack}/>);
        expect(screen.getByText(/Loading simulation.../i)).toBeInTheDocument();
    });

    it('Initialize and renders simulation interface correctly' ,async () => {
        render(<EventSimulator event={mockEvent} onBack={mockOnBack}/>);

        await waitFor(() => {
            expect(screen.getAllByText('AAPL').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Tech Crash 2008').length).toBeGreaterThan(0);
            expect(screen.getAllByText('R 10000.00').length).toBe(2);
            expect(screen.getByText('COST: R100.00')).toBeInTheDocument();
        });
    });

    it('triggers back button handler when clicked', async () => {

        render(<EventSimulator event={mockEvent} onBack={mockOnBack}/>);

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
    });

    it('Tests clicking the Skip foward button and index incrementing accordingly', async () => {
        render(<EventSimulator event={mockEvent} onBack={mockOnBack}/>);

        await waitFor(() => {
            expect(screen.getByText('Skip Forward')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Skip Forward'));
        expect(screen.getByText('COST: R105.00')).toBeInTheDocument();
    });

    it('Open trade confirmation window and executes a successful BUY order', async () => {
        (apiClient as jest.Mock).mockResolvedValue({
            positions: { AAPL: 2},
            nav: 10000
        });

        render(<EventSimulator event={mockEvent} onBack={mockOnBack}/> );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /^Buy$/i })).toBeInTheDocument();
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

        fireEvent.click(screen.getByRole('button', { name: /^Sell$/i }));
        fireEvent.click(screen.getByText('Confirm Trade'));

        expect(screen.getByText('You have no shares to sell.')).toBeInTheDocument();
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
        expect(screen.getByText('R 12500.50')).toBeInTheDocument();
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
            fireEvent.click(screen.getByText('Confirm Trade'));
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

    it('handles invalid trade quantity and insufficient cash', async () => {
        render(<EventSimulator event={mockEvent} onBack={mockOnBack}/>);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /^Buy$/i })).toBeInTheDocument();
        });

        const qtyInput = screen.getByPlaceholderText('Quantity');

        fireEvent.change(qtyInput, { target: { value: '999999'} });
        fireEvent.click(screen.getByRole('button' , { name: /^Buy$/i }));
        await act(async () => {
            fireEvent.click(screen.getByText('Confirm Trade'));
        });

        expect(screen.getByText(/Not enough cash|Invalid quantity/i)).toBeInTheDocument();
    });

    it('handles API errors during trade execution and simulation finish', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        (apiClient as jest.Mock).mockRejectedValueOnce(new Error('Trade API Error'));

        render(<EventSimulator event={mockEvent} onBack={mockOnBack}/>);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /^Buy$/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /^Buy$/i }));
        await act(async () => {
            fireEvent.click(screen.getByText('Confirm Trade'));
        });

        await waitFor(() => {
            expect(screen.getByText('Trade failed. Please try again.')).toBeInTheDocument();
        });

        (apiClient as jest.Mock).mockRejectedValueOnce(new Error('Finish API Error'));

        fireEvent.click(screen.getByText('View Simulation Summary'));

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
                'Simulation finish failed.',
                expect.any(Error)
            )
        });

        consoleSpy.mockRestore();
    });

    it('cancels pending trade modal without executing', async () => {
        render(<EventSimulator event={mockEvent} onBack={mockOnBack}/>);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /^Buy$/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /^Buy$/i }));
        expect(screen.getByTestId('trade-confirm-modal')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Cancel Trade'));
        expect(screen.queryByTestId('trade-confirm-modal')).not.toBeInTheDocument();
    });

    it('handles playback speed control adjustments', async () => {
        render(<EventSimulator event={mockEvent} onBack={mockOnBack}/>);

        await waitFor(() => {
            expect(screen.getByText('2x')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('2x'));
        expect(screen.getByText('2x')).toHaveClass('bg-[var(--background-alt)]');

        fireEvent.click(screen.getByText('4x'));
        expect(screen.getByText('4x')).toHaveClass('bg-[var(--background-alt)]');
    });

    it('calculates and displays Greeks on load', async() => {
        render(<EventSimulator event={mockEvent} onBack={mockOnBack}/>);

        await waitFor(() => {
            expect(screen.getByText('Call Option Risk')).toBeInTheDocument();
        });

        expect(calc_greeks).toHaveBeenCalledWith({
            current_price: 100,
            strike_price: 100,
            time_to_expire: 3 / 365,
            interest_rate: 0.05,
            sigma: 0.25,
            option_type: 'call'
        });

        expect(screen.getByText('0.512')).toBeInTheDocument();
        expect(screen.getByText('0.0234')).toBeInTheDocument();
        expect(screen.getByText('-0.045')).toBeInTheDocument();
        expect(screen.getByText('0.123')).toBeInTheDocument();
        expect(screen.getByText('0.057')).toBeInTheDocument();
    });

    it('Recalculates greeks upon strike price change', async () => {
        render(<EventSimulator event={mockEvent} onBack={mockOnBack}/>);

        await waitFor(() => {
            expect(screen.getByText('Call Option Risk')).toBeInTheDocument();
        });

        const strikeInput = screen.getByDisplayValue('100') || screen.getAllByRole('spinbutton')[1];
       
        await act(async () => {
            fireEvent.change(strikeInput, { target: { value: '110'} });
        });

        await waitFor(() => {
            expect(calc_greeks).toHaveBeenCalledWith(
                expect.objectContaining({
                    strike_price: 110
                })
            );
        }, {timeout: 3000 });
        
    });

    it('Updates Days to Expirations as the simulation progresses', async () => {
        render(<EventSimulator event={mockEvent} onBack={mockOnBack}/>);

        await waitFor(() => {
            expect(screen.getByText('DTE: 3d')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Skip Forward'));

        expect(screen.getByText('DTE: 2d')).toBeInTheDocument();
        expect(calc_greeks).toHaveBeenCalledWith(
            expect.objectContaining({
                current_price: 105,
                time_to_expire: 2 / 365
            })
        );
    });

    it('falls back to 0.0000 when greeks calculations return null', async () => {
        (calc_greeks as jest.Mock).mockReturnValue(null);
        
        render(<EventSimulator event={mockEvent} onBack={mockOnBack}/>);

        await waitFor(() => {
            expect(screen.getByText('Call Option Risk')).toBeInTheDocument();
        });

        expect(screen.getAllByText('0.000').length).toBeGreaterThanOrEqual(3);
        expect(screen.getByText('0.0000')).toBeInTheDocument();
    });
});