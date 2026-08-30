import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventSimulator } from '@/components/EventSimulator';
import { startSimulation } from '@/lib/api/assets';
import { apiClient } from '@/lib/api';
import { ResponsiveContainer } from 'recharts';

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

    
});