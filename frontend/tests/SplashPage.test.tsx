import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SplashPage from '@/app/splash/page';

jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
        return <img {...props} alt={props.alt} />;
    }
}))

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ href, children, ...props }: any) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

describe('SplashPage', () => {
    it('renders the page and does&apos;t crash', () => {
        render(<SplashPage />);
        expect(screen.getByText('AutoFlow')).toBeInTheDocument();
    });

    it('displays the heading and subtitle', () => {
        render(<SplashPage />);
        expect(screen.getByText(/Master the markets with/i)).toBeInTheDocument();
        expect(screen.getByText(
            /Learn trading strategies, understand options Greeks, and replay historical market events all in a risk-free environment designed to build real skills/i
        )).toBeInTheDocument();
    });

    it('contains navigational links to Sign Up and Sign In', () => {
        render(<SplashPage />);
        const signUpLink = screen.getByRole('link', { name: /Sign Up/i });
        const signInLink = screen.getByRole('link', { name: /Sign In/i });

        expect(signUpLink).toBeInTheDocument();
        expect(signInLink).toBeInTheDocument();
        expect(signUpLink).toHaveAttribute('href', '/register');
        expect(signInLink).toHaveAttribute('href', '/login')
    });
})