import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom';
import LoginPage from '@/app/login/page';

jest.mock('@/components/login-form', () => ({
    LoginForm: () => <div data-testid="login-form-mock">Login Form Mock</div>,
}))

describe('LoginPage', () => {
    it('renders the page layout and includes the LoginForm', () => {
        render(<LoginPage/>)

        const mainElement = screen.getByRole('main')
        expect(mainElement).toBeInTheDocument()

        const loginForm = screen.getByTestId('login-form-mock')
        expect(loginForm).toBeInTheDocument()
    })
})