import { render, screen, fireEvent,  } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StrategyCard } from '@/components/StrategyCard';

const mockStrategy = {
    id: 1,
    name: 'strategy name',
    level: 'strategy level',
    category: 'strategy category',
    description: 'strategy description'
}

const mockOnClick = jest.fn();

describe('StrategyCard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    describe('StrategyCard content present', () => {
        it('renders strategy content', () => {
            render(
                <StrategyCard
                    strategy={mockStrategy}
                    onClick={mockOnClick}
                />
            );

            expect(screen.getByText(mockStrategy.name)).toBeInTheDocument();
            expect(screen.getByText(mockStrategy.level)).toBeInTheDocument();
            expect(screen.getByText(mockStrategy.category)).toBeInTheDocument();
            expect(screen.getByText(mockStrategy.description)).toBeInTheDocument();
        });

        it('calls onClick when clicked on', () => {
            render(
                <StrategyCard
                    strategy={mockStrategy}
                    onClick={mockOnClick}
                />
            );

            fireEvent.click(screen.getByRole('button'));
            expect(mockOnClick).toHaveBeenCalled();
        });
    });
})