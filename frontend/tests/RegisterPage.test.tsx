import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom';
import RegisterPage from '@/app/register/page';

jest.mock('@/components/register-form', () => ({
    RegisterForm: () => <div data-testid="register-form-mock">Register Form Mock</div>,
}))

describe('RegisterPage', () => {
    it('renders the page layout and includes the RegisterForm', () => {
        render(<RegisterPage/>)

        const mainElement = screen.getByRole('main')
        expect(mainElement).toBeInTheDocument()

        const registerForm = screen.getByTestId('register-form-mock')
        expect(registerForm).toBeInTheDocument()
    })
})