import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LearningNavbar } from '@/components/LearningNavbar';
import { usePathname } from 'next/navigation';
import { Activity } from 'react';

jest.mock('next/navigation', () => ({
    usePathname: jest.fn()
}));

jest.mock('lucide-react', () => ({
    BookOpen: (props: any) => <svg data-testid="book-open-icon" {...props} />,
    Activity: (props: any) => <svg data-testid="activity-icon" {...props}/>,
    History: (props: any) => <svg data-testid="history-icon" {...props}/>
}));

describe('LearningNavbar', () => {
    const mockUsePathname = usePathname as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the header title and description', () => {
        mockUsePathname.mockReturnValue('/learning/strategies');
        render(<LearningNavbar />);

        expect(screen.getByRole('heading', { name: /learning center/i } )).toBeInTheDocument();
        expect( screen.getByText(/master strategies, understand the greeks, and replay real market history/i )).toBeInTheDocument();
    });

    it('renders all three navigation links with correct links', () => {
        mockUsePathname.mockReturnValue('/learning/strategies');
        render(<LearningNavbar/>);

        const strategiesLink = screen.getByRole('link', { name: /strategies/i });
        const greeksLink = screen.getByRole('link', { name: /options greeks/i});
        const eventsLink = screen.getByRole('link', { name: /historical events/i });

        expect(strategiesLink).toHaveAttribute('href', '/learning/strategies');
        expect(greeksLink).toHaveAttribute('href', '/learning/greeks');
        expect(eventsLink).toHaveAttribute('href', '/learning/events');
    });

    it('applies active styles to the respective route', () => {
        mockUsePathname.mockReturnValue('/learning/greeks');
        render(<LearningNavbar/>);

        const strategiesLink = screen.getByRole('link', { name: /strategies/i });
        const greeksLink = screen.getByRole('link', { name: /options greeks/i});
        const eventsLink = screen.getByRole('link', { name: /historical events/i });

        expect(greeksLink).toHaveClass('bg-[var(--background)]');
        expect(greeksLink).toHaveClass('text-[var(--blue)]');

        expect(strategiesLink).toHaveClass('bg-[var(--blue)]/50');
        expect(eventsLink).toHaveClass('bg-[var(--blue)]/50');
    });

    it('renders all navigation tab icons', () => {
        mockUsePathname.mockReturnValue('/learning/strategies');
        render(<LearningNavbar/>);

        expect(screen.getAllByTestId('book-open-icon')).toHaveLength(2);
        expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
        expect(screen.getByTestId('history-icon')).toBeInTheDocument();
    });
});