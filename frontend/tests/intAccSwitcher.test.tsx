import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AccountSelector } from '@/components/intAccSwitcher';
import { useAccount } from '@/lib/hooks/accountContext';
import type { InternationalAccount } from '@/lib/types/accounts';

window.HTMLElement.prototype.scrollIntoView = jest.fn();

jest.mock('@/lib/hooks/accountContext', () => ({
    useAccount: jest.fn()
}));

jest.mock('next/image', () => ({
    __esModule: true,
    default: ({ src, alt, className }: any) => (
        // eslint-disable-next-line @next/next/no-img-element -- mock of next/image, not a real rendered image
        <img src={src} alt={alt} className={className} data-testid="next-image"/>
    )
}));

const mockAccounts: InternationalAccount[] = [
    { id: 1, currency_code: 'USD', balance: '1250.5' } as InternationalAccount,
    { id: 2, currency_code: 'EUR', balance: '800.00' } as InternationalAccount,
    { id: 3, currency_code: 'GBP', balance: '310.25' } as InternationalAccount,
];

describe('AccountSelector', () => {
    const mockUpdate = jest.fn();
    const mockRefetchAccounts = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        (useAccount as jest.Mock).mockReturnValue({
            accounts: mockAccounts,
            activeAccount: mockAccounts[0],
            isLoading: false,
            update: mockUpdate,
            refetchAccounts: mockRefetchAccounts
        });
    });

    it('renders correctly with label and initial active account value', () => {
        render(<AccountSelector label="Select Primary Account"/>);

        expect(screen.getByText('Select Primary Account')).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('displays loading state placeholder when the accounts are loading', () => {
        (useAccount as jest.Mock).mockReturnValue({
            accounts: [],
            activeAccount: null,
            isLoading: true,
            update: mockUpdate,
            refetchAccounts: mockRefetchAccounts
        });

        render(<AccountSelector placeholder='Choose Account'/>);

        expect(screen.getByRole('combobox')).toBeDisabled();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('disables trigger when account list is empty', () => {
        (useAccount as jest.Mock).mockReturnValue({
            accounts: [],
            activeAccount: null,
            isLoading: false,
            update: mockUpdate,
            refetchAccounts: mockRefetchAccounts
        });

        render(<AccountSelector />);
        expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('calls refetchAccounts when selector dropdown opens', async () => {
        render(<AccountSelector />);

        const trigger = screen.getByRole('combobox');
        fireEvent.click(trigger);

        expect(mockRefetchAccounts).toHaveBeenCalledTimes(1);
    });

    it('renders currency code, formatted balance, and flag for each account', async () => {
        render(<AccountSelector/>);

        const trigger = screen.getByRole('combobox');
        fireEvent.click(trigger);

        const listbox = await screen.findByRole('listbox');

        expect(within(listbox).getByText(/USD 1250.50/i)).toBeInTheDocument();
        expect(within(listbox).getByText(/EUR 800.00/i)).toBeInTheDocument();
        expect(within(listbox).getByText(/GBP 310.25/i)).toBeInTheDocument();

        const listboxFlags = within(listbox).getAllByTestId('next-image');
        expect(listboxFlags[0]).toHaveAttribute('src', 'https://flagcdn.com/w20/us.png');
        expect(listboxFlags[1]).toHaveAttribute('src', 'https://flagcdn.com/w20/eu.png');
        expect(listboxFlags[2]).toHaveAttribute('src', 'https://flagcdn.com/w20/gb.png');
    });

    it('triggers update and onChange callback with the selected account on change', async () => {
        const mockOnChange = jest.fn();

        render(<AccountSelector onChange={mockOnChange}/>);

        const trigger = screen.getByRole('combobox');
        fireEvent.click(trigger);

        const listbox = await screen.findByRole('listbox');
        const euroOption = within(listbox).getByText(/EUR 800.00/i);
        fireEvent.click(euroOption);

        expect(mockUpdate).toHaveBeenCalledWith(mockAccounts[1]);
        expect(mockOnChange).toHaveBeenCalledWith(mockAccounts[1]);
    });
});