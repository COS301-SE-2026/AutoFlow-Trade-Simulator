import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GreeksDisplay from '@/components/GreeksDisplay';
import { TechTreeContext } from '@/context/TechTreeContext';
import { CartesianGrid, ResponsiveContainer, YAxis } from 'recharts';
import { AreaChart } from 'lucide-react';

jest.mock('recharts', () => ({
    ResponsiveContainer: ({ children} : { children : React.ReactNode }) => <div>{children}</div>,
    AreaChart: () => <div data-testid="area-chart"/>,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null
}));

const ALL_GREEKS = ['greeks_delta', 'greeks_gamma', 'greeks_theta', 'greeks_vega', 'greeks_rho'];

function renderGreeks(upgrades: string[] = ALL_GREEKS) {
    const value = {
        tree: { upgrades, experience_points: 0 } as any,
        xp: 0,
        loading: false,
        error: null,
        refetch: jest.fn(),
        purchaseTech: jest.fn(),
    };
    return render(
        <TechTreeContext.Provider value={value}>
            <GreeksDisplay/>
        </TechTreeContext.Provider>
    );
}

describe('GreeksDisplay Component', () => {

    it('shows a locked prompt for Greeks that have not been unlocked in the tech tree', () => {
        renderGreeks([]);

        expect(screen.getAllByText(/Locked — Unlock in Tech Tree/i)).toHaveLength(5);
    });

    it('does not show locked prompts once every Greek is unlocked', () => {
        renderGreeks();

        expect(screen.queryByText(/Locked — Unlock in Tech Tree/i)).not.toBeInTheDocument();
    });

    it('renders the header and all Greeks within the table', () => {
        renderGreeks();

        expect(screen.getByText('Options Greeks Reference')).toBeInTheDocument();

        expect(screen.getByText('Delta')).toBeInTheDocument();
        expect(screen.getByText('Gamma')).toBeInTheDocument();
        expect(screen.getByText('Theta')).toBeInTheDocument();
        expect(screen.getByText('Vega')).toBeInTheDocument();
        expect(screen.getByText('Rho')).toBeInTheDocument();
    });

    it('expands row details, charts appear and other relevant data', () => {
        renderGreeks();

        expect(screen.queryByText('Real World Example')).not.toBeInTheDocument();

        const deltaRow = screen.getByText('Delta').closest('button');
        expect(deltaRow).toBeInTheDocument();
        fireEvent.click(deltaRow!);

        expect(screen.getByText('Real World Example')).toBeInTheDocument();
        expect(screen.getByText(/You hold a TSLA call with/i)).toBeInTheDocument();
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
        expect(screen.getByText('IN PLAIN ENGLISH')).toBeInTheDocument();
    });

    it('collapses the expanded column in qustion when button is click a 2nd time', () => {
        renderGreeks();

        const deltaRow = screen.getByText('Delta').closest('button');

        fireEvent.click(deltaRow!);
        expect(screen.getByText('Real World Example')).toBeInTheDocument();

        fireEvent.click(deltaRow!);
        expect(screen.queryByText('Real World Example')).not.toBeInTheDocument();
    });
});