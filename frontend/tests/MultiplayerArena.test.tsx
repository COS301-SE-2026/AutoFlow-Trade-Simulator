import type { UseMultiplayerMatch } from "@/hooks/useMultiplayerMatch";

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MultiplayerArena } from "@/components/MultiplayerArena";

export function makeMatch(overrides: Partial<UseMultiplayerMatch> = {}): UseMultiplayerMatch {
    const day = {
        day_index: 0,
        date: '2024-01-01',
        bar: { close: 100 },
        cash_balance: 10000,
        position_qty: 0,
        opponent_cash_balance: 10000,
        opponent_position_qty: 0,
        qte: null,
    };

    const match = {
        symbol: 'AAPL',
        total_days: 30,
        initial_balance: 10000,
    };

    return {
        day,
        match,
        error: null,
        qteAnswered: false,
        actionSettled: false,
        lastQteResult: null,
        lastOpponentAction: null,
        myTrades: [],
        buy: jest.fn(),
        sell: jest.fn(),
        answerQte: jest.fn(),
        ...overrides,
    } as unknown as UseMultiplayerMatch;
}

beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 800 });
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 600 });
});

jest.mock('../components/TradeConfirmModal', () => ({
    __esModule: true,
    default: ({ onConfirm, onCancel }: any) => (
        <div>
            <button onClick={onConfirm}>confirm</button>
            <button onClick={onCancel}>cancel</button>
        </div>
    ),
}));

describe('MultiplayerArena', () => {
    it('renders nothing when day or match is missing', () => {
        const { container } = render(
            <MultiplayerArena m={makeMatch({ day: null } as any)} onBack={jest.fn()} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders chart, portfolio, and trade panel in the normal state', () => {
        render(<MultiplayerArena m={makeMatch()} onBack={jest.fn()} />);

        expect(screen.getByText('Portfolio')).toBeInTheDocument();

        expect(screen.getByRole('button', { name: 'Buy' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sell' })).toBeInTheDocument();
    });

    it('renders the QTE panel when a question is active', () => {
        const m = makeMatch();
        (m.day as any).qte = {
            prompt: 'What is a stop-loss?',
            options: ['A price floor', 'A type of order'],
            timeout_seconds: 15,
        };

        render(<MultiplayerArena m={m} onBack={jest.fn()} />);

        expect(screen.getByText('What is a stop-loss?')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'A price floor' })).toBeInTheDocument();
    });

    it('calls answerQte when an option is clicked', () => {
        const m = makeMatch();
        (m.day as any).qte = {
            prompt: 'Pick one',
            options: ['A', 'B'],
            timeout_seconds: 15,
        };

        render(<MultiplayerArena m={m} onBack={jest.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: 'A' }));

        expect(m.answerQte).toHaveBeenCalledWith('A');
    });

    it('opens the trade confirm modal and calls buy on confirm', () => {
        const m = makeMatch();
        render(<MultiplayerArena m={m} onBack={jest.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Buy' }));
        fireEvent.click(screen.getByRole('button', { name: 'confirm' }));

        expect(m.buy).toHaveBeenCalled();
    });

    it('shows the locked-in panel when the move is settled', () => {
        render(<MultiplayerArena m={makeMatch({ actionSettled: true } as any)} onBack={jest.fn()} />);
        expect(screen.getByText(/move is locked in/i)).toBeInTheDocument();
    });

    it('shows the leave confirmation, and calls onBack when confirmed', () => {
        const onBack = jest.fn();
        render(<MultiplayerArena m={makeMatch()} onBack={onBack} />);

        fireEvent.click(screen.getByRole('button', { name: /Back/ }));
        fireEvent.click(screen.getByRole('button', { name: 'Leave' }));

        expect(onBack).toHaveBeenCalled();
    });

    it('renders the opponent activity line when one exists', () => {
        const m = makeMatch({
            lastOpponentAction: { day_index: 0, action: 'buy', qty: 5 },
        } as any);

        render(<MultiplayerArena m={m} onBack={jest.fn()} />);
        expect(screen.getByText(/bought/)).toBeInTheDocument();
    });

    it('renders the trade history rows when trades exist', () => {
        const m = makeMatch({
            myTrades: [{ day_index: 0, action: 'buy', qty: 2, price: 100 }],
        } as any);

        render(<MultiplayerArena m={m} onBack={jest.fn()} />);
        expect(screen.getByText(/BUY 2 @/)).toBeInTheDocument();
    });
})