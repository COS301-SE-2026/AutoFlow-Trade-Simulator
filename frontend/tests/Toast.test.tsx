import { render, screen, act, fireEvent } from '@testing-library/react';
import Toast from '@/components/Toast';

describe('Toast component', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
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

    it('calls onClose after 4 seconds', () => {
        const onClose = jest.fn();
        render(<Toast message='whatever' onClose={onClose} />);

        act(() => {
            jest.advanceTimersByTime(4000);
        });
        act(() => {
            jest.advanceTimersByTime(300);
        });

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = jest.fn();
        render(<Toast message='whatever' onClose={onClose} />);

        const closeButton = screen.getByRole('button');
        fireEvent.click(closeButton);

        act(() => {
            jest.advanceTimersByTime(300);
        });
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});