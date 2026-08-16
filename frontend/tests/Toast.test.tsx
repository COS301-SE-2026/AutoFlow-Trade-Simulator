import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toast from '@/components/Toast';

describe('Toast component', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('renders with the correct message', () => {
        render(<Toast message='hello toast' onClose={() => {}} />);
        expect(screen.getByText('hello toast')).toBeInTheDocument();
    });

    it('becomes visible after mount animation', () => {
        render(<Toast message='animate toast' onClose={() => {}} />);
        const toast = screen.getByRole('alert');
        expect(toast).toHaveClass('opacity-0');

        act(() => {
            jest.advanceTimersByTime(50);
        });
        expect(toast).toHaveClass('opacity-100');
    });
})