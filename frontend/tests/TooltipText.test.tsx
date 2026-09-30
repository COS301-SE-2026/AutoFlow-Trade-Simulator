import { render, screen, fireEvent } from '@testing-library/react';
import { TooltipText } from '@/components/news/TooltipText';
import { parseDescriptionForTerms } from '@/components/news/tooltipParser';
import { parse } from 'path';

jest.mock('@/components/news/tooltipParser', () => ({
    parseDescriptionForTerms: jest.fn()
}));

describe('TooltipText', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        Object.defineProperty(window, 'scrollX', {value: 10, writable: true} );
        Object.defineProperty(window, 'scrollY', {value: 20, writable: true} );
    });

    it('renders plain text segements without buttons or tooltips', () => {
        (parseDescriptionForTerms as jest.Mock).mockReturnValue([
            { text: 'Hello World', isTerms: false}
        ]);

        render(<TooltipText text="Hello World" />);

        expect(screen.getByText('Hello World')).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders term segments as interactive buttons', () => {
        (parseDescriptionForTerms as jest.Mock).mockReturnValue([
            { text: 'Plain text ', isTerms: false},
            { text: 'Term', isTerm: true, definition: 'Term definition'}
        ]);

        render(<TooltipText text="Plain text Term" />);

        const button = screen.getByRole('button', {name : 'Term'});
        expect(button).toBeInTheDocument();
        expect(button).not.toHaveAttribute('aria-describedby');
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('shows tooltip on mouse enter and hides on mouse leave', () => {
        (parseDescriptionForTerms as jest.Mock).mockReturnValue([
            { text: 'Term', isTerm: true, definition: 'A helpful definition'}
        ]);

        render(<TooltipText text="Term" />);

        const button = screen.getByRole('button', { name: 'Term' });

        button.getBoundingClientRect = jest.fn().mockReturnValue({
            top: 100,
            left: 50,
            width: 40,
            height: 20
        });

        fireEvent.mouseEnter(button);

        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveTextContent('A helpful definition');
        expect(tooltip).toHaveAttribute('id', 'tooltip-0');
        expect(button).toHaveAttribute('aria-describedby', 'tooltip-0');

        expect(tooltip).toHaveStyle({
            // position: fixed is viewport-relative, so the page scroll (set to 10/20 above) must not be added
            top: '92px',
            left: '70px'
        });

        fireEvent.mouseLeave(button);
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
        expect(button).not.toHaveAttribute('aria-describebdy');
    });

    it('shgows tooltip on focus and hides on blur', () => {
        (parseDescriptionForTerms as jest.Mock).mockReturnValue([
            { text: 'Focus Term', isTerm: true, definition: 'Focused definition'}
        ]);

        render(<TooltipText text="Focus Terms" />);

        const button = screen.getByRole('button', { name: 'Focus Term'});
        button.getBoundingClientRect = jest.fn().mockReturnValue({
            top: 50,
            left: 50,
            width: 20,
            height: 10
        });

        fireEvent.focus(button);
        expect(screen.getByRole('tooltip')).toHaveTextContent('Focused definition');

        fireEvent.blur(button);
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('toggles tooltip button on click', () => {
        (parseDescriptionForTerms as jest.Mock).mockReturnValue([
            {text: 'Click Term', isTerm: true, definition: 'Click definition'}
        ]);

        render(<TooltipText text="Click Term" />);

        const button = screen.getByRole('button', { name: 'Click Term' });
        button.getBoundingClientRect = jest.fn().mockReturnValue({
            top: 10,
            left: 10,
            width: 10,
            height: 10
        });

        fireEvent.click(button);
        expect(screen.getByRole('tooltip')).toBeInTheDocument();

        fireEvent.click(button);
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('handles terms without a definition without breaking or rendering a tooltip', () => {
        (parseDescriptionForTerms as jest.Mock).mockReturnValue([
            { text: 'Term No Def', isTerm: true, definition: undefined}
        ]);

        render(<TooltipText text="Term No Def"/>);

        const button = screen.getByRole('button', { name: 'Term No Def' });
        button.getBoundingClientRect = jest.fn().mockReturnValue({
            top: 0,
            left: 0,
            width: 0,
            height: 0,
        });

        fireEvent.mouseEnter(button);
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('safely handles mouse event if element ref is missing', () => {
        (parseDescriptionForTerms as jest.Mock).mockReturnValue([
            { text: 'Term', isTerm: true, definition: 'Def'}
        ]);

        const { container } = render(<TooltipText text="Term" />);
        const button = screen.getByRole('button', { name: 'Term' });

        button.remove();

        expect(() => {
            fireEvent.mouseEnter(button);
        }).not.toThrow();
        
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
});