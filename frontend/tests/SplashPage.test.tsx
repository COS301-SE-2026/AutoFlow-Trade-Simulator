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

    it('renders the CTA "Start Learning For Free" with correct Link', () => {
        render(<SplashPage />);
        const cta = screen.getByRole('link', { name: /Start Learning For Free/i });
        expect(cta).toBeInTheDocument();
        expect(cta).toHaveAttribute('href', '/register');
    });

    it('renders the "View Features" button', () => {
        render(<SplashPage />);
        const viewFeaturesBtn = screen.getByRole('button', { name: /View Features/i });
        expect(viewFeaturesBtn).toBeInTheDocument();
    });

    it('displays, all feature cards with headings and descriptions', () => {
        render(<SplashPage />);
        const features = [
            'Historical Replay',
            'Strategy Library',
            'Risk-Free Practice',
            'Options Greeks',
            'Live Charts',
            'AI Insights',
        ];
        features.forEach((title) => {
            expect(screen.getByText(title)).toBeInTheDocument();
        });
    });

    it('renders the statistics section', () => {
        render(<SplashPage />);
        expect(screen.getByText('4+')).toBeInTheDocument();
        expect(screen.getByText('Active Learners')).toBeInTheDocument();
        expect(screen.getByText('10+')).toBeInTheDocument();
        expect(screen.getByText('Trading Strategies')).toBeInTheDocument();
        expect(screen.getByText('No')).toBeInTheDocument();
        expect(screen.getByText('Cost to Start')).toBeInTheDocument();
    });

    it('renders the footer with copyright and links', () => {
        render(<SplashPage />);
        expect(screen.getByText(/© 2026 AutoFlow. All rights reserved./i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Terms/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Privacy/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Support/i })).toBeInTheDocument();
    });


})