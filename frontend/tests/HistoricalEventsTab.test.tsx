import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HistoricalEventsTab } from '@/components/HistoricalEventsTab';


jest.mock('@/components/EventSimulator', () => ({
    EventSimulator: ({ event, onBack }: { event: any; onBack: () => void}) => (
        <div data-testid="event-simulator-mock">
            <h2>Simulating: {event.title}</h2>
            <button data-testid="back-button" onClick={onBack}>
                Back to Events
            </button>
        </div>
    )
}));

describe('HistoricalEventsTab', () => {
    it('renders the tab header and all historical event cards', () => {
        render(<HistoricalEventsTab />);

        expect(screen.getByText('Replay real market history')).toBeInTheDocument();

        expect(screen.getByText('Steinhoff Accounting Scandal')).toBeInTheDocument();
        expect(screen.getByText("AB InBev's Mega Takeover of SABMiller")).toBeInTheDocument();
        expect(screen.getByText('Liberty Holdings Ransomware Attack')).toBeInTheDocument();

        expect(screen.getAllByText('SNH').length).toBeGreaterThan(0);
        expect(screen.getAllByText('SAB').length).toBeGreaterThan(0);
        expect(screen.getAllByText('LBH').length).toBeGreaterThan(0);

        const startButtons = screen.getAllByText('Start simulation');
        expect(startButtons.length).toBeGreaterThan(0);
    });

    it('launches EventSimulator when as event card is clicked', () => {
        render(<HistoricalEventsTab/>);

        expect(screen.queryByTestId('event-simulator-mock')).not.toBeInTheDocument();

        const steinhoffCard = screen.getByText('Steinhoff Accounting Scandal').closest('button');
        expect(steinhoffCard).not.toBeNull();
        fireEvent.click(steinhoffCard!);

        expect(screen.getByTestId('event-simulator-mock')).toBeInTheDocument();
        expect(screen.getByText('Simulating: Steinhoff Accounting Scandal')).toBeInTheDocument();
    });

    it('returns to the event selection list when clicking back from EventSimulator', () => {
        render(<HistoricalEventsTab />);

        const steinhoffCard = screen.getByText('Steinhoff Accounting Scandal').closest('button');
        fireEvent.click(steinhoffCard!);

        expect(screen.getByTestId('event-simulator-mock')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('back-button'));

        expect(screen.queryByTestId('event-simulator-mock')).not.toBeInTheDocument();
        expect(screen.getByText('Replay real market history')).toBeInTheDocument();
    });
});