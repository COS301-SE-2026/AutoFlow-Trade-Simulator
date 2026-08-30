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