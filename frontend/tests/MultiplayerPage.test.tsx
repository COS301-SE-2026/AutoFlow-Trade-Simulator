import { render, screen, fireEvent } from '@testing-library/react';
import Multiplayer from '@/app/multiplayer/page';

jest.mock('../components/navbar', () => ({
    Navbar: () => <nav data-testid='navbar' />,
}));

jest.mock('../components/MultiplayerArena', () => ({
    MultiplayerArena: ({ onBack }: any) => (
        <div data-testid='arena'>
            <button onClick={onBack}>arena-back</button>
        </div>
    ),
}));

jest.mock('../lib/jwt', () => ({
    getUserIdFromToken: () => 6,
}));

jest.mock('../lib/hooks/useAuth', () => ({
    useAuth: jest.fn(),
}));

jest.mock('../hooks/useMultiplayerMatch', () => ({
    useMultiplayerMatch: jest.fn(),
}));

import { useAuth } from '../lib/hooks/useAuth';
import { useMultiplayerMatch } from '../hooks/useMultiplayerMatch';

const mockAuth = useAuth as jest.Mock;
const mockHook = useMultiplayerMatch as jest.Mock;

function makeMatchState(overrides: Record<string, unknown> = {}) {
    return {
        status: 'idle',
        match: null,
        day: null,
        end: null,
        error: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        ...overrides,
    };
}

beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockReturnValue({ token: 'tok', isLoading: false });
    mockHook.mockReturnValue(makeMatchState());
});

describe('Multiplayer page', () => {
    it('shows loading when auth is still loading', () => {
        mockAuth.mockReturnValue({ token: null, isLoading: true });
        render(<Multiplayer />);
        expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('prompts to log in when there is no token', () => {
        mockAuth.mockReturnValue({ token: null, isLoading: false });
        render(<Multiplayer />);
        expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
    });

    it('renders the lobby when idle and connects on Find Match', () => {
        const connect = jest.fn();
        mockHook.mockReturnValue(makeMatchState({ status: 'idle', connect }));
        render(<Multiplayer />);

        expect(screen.getByRole('heading', { name: /head to head/i })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /find match/i }));
        expect(connect).toHaveBeenCalled();
    });

    it('shows the lobby error when the hook reports one', () => {
        mockHook.mockReturnValue(makeMatchState({ status: 'idle', error: 'connection lost' }));
        render(<Multiplayer />);
        expect(screen.getByRole('alert')).toHaveTextContent(/connection lost/i);
    });

    it('renders the queueing screen and disconnects on cancel', () => {
        const disconnect = jest.fn();
        mockHook.mockReturnValue(makeMatchState({ status: 'queued', disconnect }));
        render(<Multiplayer />);

        expect(screen.getByRole('heading', { name: /finding an opponent/i })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(disconnect).toHaveBeenCalled();
    });

    it('renders the match-found holding screen', () => {
        mockHook.mockReturnValue(makeMatchState({
            status: 'playing',
            match: { symbol: 'AAPL', total_days: 30, initial_balance: 10000, opponent_user_id: 7 },
            day: null,
        }));
        render(<Multiplayer />);
        expect(screen.getByText(/match found/i)).toBeInTheDocument();
    });

    it('renders the arena when playing with a day', () => {
        mockHook.mockReturnValue(makeMatchState({
            status: 'playing',
            match: { symbol: 'AAPL', total_days: 30, initial_balance: 10000, opponent_user_id: 7 },
            day: { day_index: 0 },
        }));
        render(<Multiplayer />);
        expect(screen.getByTestId('arena')).toBeInTheDocument();
    });

    it('renders a win result screen', () => {
        mockHook.mockReturnValue(makeMatchState({
            status: 'ended',
            match: { symbol: 'AAPL', total_days: 30, initial_balance: 10000 },
            end: { winner_user_id: 6, reason: 'completed', final_balances: { '6': 12000, '7': 9000 } },
        }));
        render(<Multiplayer />);
        expect(screen.getByRole('heading', { name: /you won/i })).toBeInTheDocument();
    });

    it('renders a loss result screen', () => {
        mockHook.mockReturnValue(makeMatchState({
            status: 'ended',
            match: { symbol: 'AAPL', total_days: 30, initial_balance: 10000 },
            end: { winner_user_id: 7, reason: 'completed', final_balances: { '6': 8000, '7': 11000 } },
        }));
        render(<Multiplayer />);
        expect(screen.getByRole('heading', { name: /you lost/i })).toBeInTheDocument();
    });

    it('renders a draw result screen', () => {
        mockHook.mockReturnValue(makeMatchState({
            status: 'ended',
            match: { symbol: 'AAPL', total_days: 30, initial_balance: 10000 },
            end: { winner_user_id: null, reason: 'completed', final_balances: { '6': 10000, '7': 10000 } },
        }));
        render(<Multiplayer />);
        expect(screen.getByRole('heading', { name: /draw/i })).toBeInTheDocument();
    });

    it('shows the opponent-disconnected note on the result screen', () => {
        mockHook.mockReturnValue(makeMatchState({
            status: 'ended',
            match: { symbol: 'AAPL', total_days: 30, initial_balance: 10000 },
            end: { winner_user_id: 6, reason: 'opponent_disconnected', final_balances: { '6': 12000, '7': 9000 } },
        }));
        render(<Multiplayer />);
        expect(screen.getByText(/your opponent disconnected/i)).toBeInTheDocument();
    });

    it('disconnects when Back to Lobby is clicked on the result screen', () => {
        const disconnect = jest.fn();
        mockHook.mockReturnValue(makeMatchState({
            status: 'ended',
            match: { symbol: 'AAPL', total_days: 30, initial_balance: 10000 },
            end: { winner_user_id: 6, reason: 'completed', final_balances: { '6': 12000, '7': 9000 } },
            disconnect,
        }));
        render(<Multiplayer />);
        fireEvent.click(screen.getByRole('button', { name: /back to lobby/i }));
        expect(disconnect).toHaveBeenCalled();
    });

    it('reconnects on Play Again', () => {
        const disconnect = jest.fn();
        const connect = jest.fn();
        mockHook.mockReturnValue(makeMatchState({
            status: 'ended',
            match: { symbol: 'AAPL', total_days: 30, initial_balance: 10000 },
            end: { winner_user_id: 6, reason: 'completed', final_balances: { '6': 12000, '7': 9000 } },
            disconnect, connect,
        }));
        render(<Multiplayer />);
        fireEvent.click(screen.getByRole('button', { name: /play again/i }));
        expect(disconnect).toHaveBeenCalled();
        expect(connect).toHaveBeenCalled();
    });
});