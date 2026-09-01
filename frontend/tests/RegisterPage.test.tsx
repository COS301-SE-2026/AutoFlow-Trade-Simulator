import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom';
import SignupPage from '@/app/signup/page';

jest.mock('@/components/signup-form', () => ({
    SignupForm: () => <div data-testid="signup-form-mock">Signup Form Mock</div>,
}));

jest.mock('next/image', () => ({
    __esModule: true,
    default: ({ src, alt, ...rest }: any) => (
        <div role='img' aria-label={alt} {...rest} />
    ),
}));

describe('SignupPage', () => {
    it('renders the page layout and includes the SignupForm', () => {
        render(<SignupPage/>)

        expect(screen.getByText('Autoflow')).toBeInTheDocument();

        const signupForm = screen.getByTestId('signup-form-mock');
        expect(signupForm).toBeInTheDocument();
    });
});