import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import SplashPage from '@/app/splash/page';

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
        const nav = screen.getByRole('navigation');
        const navSignUp = within(nav).getByRole('link', { name: /Sign Up/i });
        const navSignIn = within(nav).getByRole('link', { name: /Sign In/i });
        
        expect(navSignUp).toBeInTheDocument();
        expect(navSignIn).toBeInTheDocument();
        expect(navSignUp).toHaveAttribute('href', '/register');
        expect(navSignIn).toHaveAttribute('href', '/login')
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

    it('has a CTA section at the bottom with two links', () => {
        render(<SplashPage />);

        const ctaHeading = screen.getByText(/Ready To Start Your Trading Journey\?/i);
        const ctaContainer = ctaHeading.closest('div.bg-gradient-to-r') as HTMLElement;
        expect(ctaContainer).toBeInTheDocument();

        const withinCta = within(ctaContainer!);

        const createAccountLink = withinCta.getByRole('link', { name: /Create Your Free Account/i });
        const signInLink = withinCta.getByRole('link', { name: /Sign In/i });

        expect(createAccountLink).toBeInTheDocument();
        expect(createAccountLink).toHaveAttribute('href', '/register');
        expect(signInLink).toBeInTheDocument();
        expect(signInLink).toHaveAttribute('href', '/login');
    });

    it('renders the logo image', () => {
        render(<SplashPage />);
        const logo = screen.getByAltText('Autoflow');
        expect(logo).toBeInTheDocument();
        expect(logo).toHaveAttribute('src', '/logo.svg');
    })
})