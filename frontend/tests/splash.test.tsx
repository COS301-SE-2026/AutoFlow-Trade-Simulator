import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SplashPage from '@/app/splash/page';

describe('SplashPage', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    })

    describe('Basic Rendering', () => {
        it('should show the buy and sell form buttons', () => {
            render(<SplashPage />);

            expect(screen.getByText('AutoFlow')).toBeInTheDocument();

            expect(screen.getByText('Historical Replay')).toBeInTheDocument();
            expect(screen.getByText('Strategy Library')).toBeInTheDocument();
            expect(screen.getByText('Risk-Free Practice')).toBeInTheDocument();
            expect(screen.getByText('Options Greeks')).toBeInTheDocument();
            expect(screen.getByText('Live Charts')).toBeInTheDocument();
            expect(screen.getByText('AI Insights')).toBeInTheDocument();

            expect(screen.getByText('Terms')).toBeInTheDocument();
            expect(screen.getByText('Privacy')).toBeInTheDocument();
            expect(screen.getByText('Support')).toBeInTheDocument();
        });
    });
})