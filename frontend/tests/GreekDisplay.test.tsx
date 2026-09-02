import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GreeksDisplay from '@/components/GreeksDisplay';
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

describe('GreeksDisplay Component', () => {

    it('renders the header and all Greeks within the table', () => {
        render(<GreeksDisplay/>);

        expect(screen.getByText('Options Greeks Reference')).toBeInTheDocument();

        expect(screen.getByText('Delta')).toBeInTheDocument();
        expect(screen.getByText('Gamma')).toBeInTheDocument();
        expect(screen.getByText('Theta')).toBeInTheDocument();
        expect(screen.getByText('Vega')).toBeInTheDocument();
        expect(screen.getByText('Rho')).toBeInTheDocument();
    });

    it('expands row details, charts appear and other relevant data', () => {
        render(<GreeksDisplay/>);

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
        render(<GreeksDisplay/>);

        const deltaRow = screen.getByText('Delta').closest('button');

        fireEvent.click(deltaRow!);
        expect(screen.getByText('Real World Example')).toBeInTheDocument();

        fireEvent.click(deltaRow!);
        expect(screen.queryByText('Real World Example')).not.toBeInTheDocument();
    });
});