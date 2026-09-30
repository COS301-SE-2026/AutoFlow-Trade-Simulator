import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { XPindicator } from '@/components/XPindicator';
import { useTechTreeContext } from '@/context/TechTreeContext';

jest.mock('@/context/TechTreeContext', () => ({
    useTechTreeContext: jest.fn()
}));

const mockUseTechTreeContext = useTechTreeContext as jest.Mock;

describe('XPindicator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('render the XP label with the correct XP amount', () => {
        mockUseTechTreeContext.mockReturnValue({ xp: 225 });

        render(<XPindicator />);

        expect(screen.getByText('XP')).toBeInTheDocument();

        expect(screen.getByText('225')).toBeInTheDocument();
    });

    it('renders correctly when XP is 0', () => {
        mockUseTechTreeContext.mockReturnValue({ xp: 0 });

        render(<XPindicator />);

        expect(screen.getByText('0')).toBeInTheDocument();
    });
});