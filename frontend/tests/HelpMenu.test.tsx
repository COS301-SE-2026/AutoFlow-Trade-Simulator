import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider } from '@/context/AuthContext';
import HelpMenu from '@/app/help/page';

jest.mock('@/lib/hooks/useAuth', () => ({
    useAuth: () => ({
        token: 'token',
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        isLoading: false,
    })
}))

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
        prefetch: jest.fn(),
    })
}))

describe('HelpMenu content present', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    describe('HelpMenu', () => {
        it('should render all tutorials', () => {
            render(
                <AuthProvider>
                    <HelpMenu />
                </AuthProvider>
            );

            expect(screen.getByText('1. How to create an account')).toBeInTheDocument();
            expect(screen.getByText('2. How to buy and sell stocks')).toBeInTheDocument();
            expect(screen.getByText('3. How to learn about strategies')).toBeInTheDocument();
            expect(screen.getByText('4. How to view account details')).toBeInTheDocument();
        });

        it('should render all faqs', () => {
            render(
                <AuthProvider>
                    <HelpMenu />
                </AuthProvider>
            );

            expect(screen.getByText('1. Is my money real?')).toBeInTheDocument();
            expect(screen.getByText('2. How do I make more money?')).toBeInTheDocument();
            expect(screen.getByText('3. What is stop loss?')).toBeInTheDocument();
            expect(screen.getByText('4. Is the data real?')).toBeInTheDocument();
        });

        it('navbar should be visible', () => {
            render(
                <AuthProvider>
                    <HelpMenu />
                </AuthProvider>
            );

            const nav = screen.getByRole('navigation');

            expect(nav).toBeInTheDocument();
        });
    });
})