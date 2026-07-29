import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StrategyList } from '@/components/StrategyList';

const mockOnClose = jest.fn();

const levelOptions = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const;

const mockStrategies = levelOptions.map((level, index) => ({
    id: index,
    name: `strategy name ${level}`,
    level: level,
    category: `strategy category ${index}`,
    description: `strategy description ${index}`,
}))

jest.mock('@/hooks/useStrategies', () => ({
    useStrategies: () => ({
        strategies: null,
        loading: false,
        error: null,
    }),
}))

describe('StrategyList', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    describe('StrategyList content present', () => {
        it('renders level selector buttons', async () => {
            jest.spyOn(require('@/hooks/useStrategies'), 'useStrategies').mockReturnValue({
                strategies: [],
                loading: false,
                error: null,
            });

            render(
                <StrategyList />
            );

            levelOptions.forEach((level) => {
                expect(screen.getByRole('button', { name: level })).toBeInTheDocument();
            })
        });

        it('renders strategy content', async () => {
            jest.spyOn(require('@/hooks/useStrategies'), 'useStrategies').mockReturnValue({
                strategies: mockStrategies,
                loading: false,
                error: null,
            });

            render(
                <StrategyList />
            );

            mockStrategies.forEach((strategy) => {
                expect(screen.getByText(strategy.name)).toBeInTheDocument();
                expect(screen.getByText(strategy.category)).toBeInTheDocument();
                expect(screen.getByText(strategy.description)).toBeInTheDocument();
            })
        });

        it('renders missing strategies when there are none', async () => {
            jest.spyOn(require('@/hooks/useStrategies'), 'useStrategies').mockReturnValue({
                strategies: [],
                loading: false,
                error: null,
            });

            render(
                <StrategyList />
            );

            expect(screen.getByText('no strategies found')).toBeInTheDocument();
        });

        it('filters for levels working', async () => {
            jest.spyOn(require('@/hooks/useStrategies'), 'useStrategies').mockReturnValue({
                strategies: mockStrategies,
                loading: false,
                error: null,
            });

            render(
                <StrategyList />
            );

            fireEvent.click(screen.getByRole('button', { name: 'All' }));
            expect(screen.queryByText(`strategy name All`)).toBeInTheDocument();
            expect(screen.queryByText(`strategy name Beginner`)).toBeInTheDocument();
            expect(screen.queryByText(`strategy name Intermediate`)).toBeInTheDocument();
            expect(screen.queryByText(`strategy name Advanced`)).toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: 'Beginner' }));
            expect(screen.queryByText(`strategy name All`)).not.toBeInTheDocument();
            expect(screen.queryByText(`strategy name Beginner`)).toBeInTheDocument();
            expect(screen.queryByText(`strategy name Intermediate`)).not.toBeInTheDocument();
            expect(screen.queryByText(`strategy name Advanced`)).not.toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: 'Intermediate' }));
            expect(screen.queryByText(`strategy name All`)).not.toBeInTheDocument();
            expect(screen.queryByText(`strategy name Beginner`)).not.toBeInTheDocument();
            expect(screen.queryByText(`strategy name Intermediate`)).toBeInTheDocument();
            expect(screen.queryByText(`strategy name Advanced`)).not.toBeInTheDocument();

            fireEvent.click(screen.getByRole('button', { name: 'Advanced' }));
            expect(screen.queryByText(`strategy name All`)).not.toBeInTheDocument();
            expect(screen.queryByText(`strategy name Beginner`)).not.toBeInTheDocument();
            expect(screen.queryByText(`strategy name Intermediate`)).not.toBeInTheDocument();
            expect(screen.queryByText(`strategy name Advanced`)).toBeInTheDocument();

        });
    });
})