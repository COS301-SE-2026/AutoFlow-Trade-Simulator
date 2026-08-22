import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StrategyDetail } from '@/components/StrategyDetail';

const mockStrategy = {
    id: 1,
    name: 'strategy name',
    level: 'strategy level',
    category: 'strategy category',
    description: 'strategy description',

    steps: ['step 1', 'step 2', 'step 3'],
    pros: ['pros 1', 'pros 2', 'pros 3'],
    cons: ['cons 1', 'cons 2', 'cons 3'],
}

const mockOnClose = jest.fn();
const mockSwitchToEvents = jest.fn();

jest.mock('@/hooks/useStrategy', () => ({
    useStrategy: jest.fn(),
}))

jest.mock('@/context/LearningContext', () => ({
    useLearning: jest.fn(),
}))


describe('StrategyDetail', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        const { useStrategy } = require('@/hooks/useStrategy');
        useStrategy.mockReturnValue({
            strategy: mockStrategy,
            loading: false,
            error: null,
        })

        const { useLearning } = require('@/context/LearningContext');
        useLearning.mockReturnValue({
            activeTab: 'strategies',
            setActiveTab: jest.fn(),
            switchToEvents: mockSwitchToEvents,
        })
    })

    describe('StrategyDetail content present', () => {
        it('renders strategy content', async () => {
            jest.spyOn(require('@/hooks/useStrategy'), 'useStrategy').mockReturnValue({
                strategy: mockStrategy,
                loading: false,
                error: null,
            });

            render(
                <StrategyDetail
                    id={mockStrategy.id}
                    onClose={mockOnClose}
                />
            );

            await waitFor(() => {
                expect(screen.getByText(mockStrategy.name)).toBeInTheDocument();
            });

            expect(screen.getByText(mockStrategy.level)).toBeInTheDocument();
            expect(screen.getByText(mockStrategy.category)).toBeInTheDocument();
            expect(screen.getByText(mockStrategy.description)).toBeInTheDocument();

            mockStrategy.steps.forEach((step, index) => {
                expect(screen.getByText(`${index + 1}. ${step}`)).toBeInTheDocument();
            });

            mockStrategy.pros.forEach((pro, index) => {
                expect(screen.getByText(`${index + 1}. ${pro}`)).toBeInTheDocument();
            });

            mockStrategy.cons.forEach((con, index) => {
                expect(screen.getByText(`${index + 1}. ${con}`)).toBeInTheDocument();
            });
        });

        it('close buttons can be clicked', () => {
            render(
                <StrategyDetail
                    id={mockStrategy.id}
                    onClose={mockOnClose}
                />
            );

            fireEvent.click(screen.getByTestId('close'));
            expect(mockOnClose).toHaveBeenCalled();
        });

        it('try it now button clicked', () => {
            render(
                <StrategyDetail
                    id={mockStrategy.id}
                    onClose={mockOnClose}
                />
            );

            fireEvent.click(screen.getByTestId('Try it now button'));

            expect(mockSwitchToEvents).toHaveBeenCalled();
        });
    });
})