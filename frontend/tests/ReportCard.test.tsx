import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReportCard } from '@/components/ReportCard';
import type { Reports } from '@/hooks/useReports';

const mockPositiveReport: Reports = {
    id: 1,
    report_id: 101,
    ticker: 'AAPL',
    open_price: '150.0',
    close_price: '157.5',
    period_high: '160.0',
    period_low: '148.5',
    pct_change: 5.0,
};

const mockNegativeReport: Reports = {
    id: 2,
    report_id: 102,
    ticker: 'TSLA',
    open_price: '200.0',
    close_price: '180.0',
    period_high: '205.0',
    period_low: '175.0',
    pct_change: -10.0,
};

const mockZeroReport: Reports = {
    id: 3,
    report_id: 103,
    ticker: 'MSFT',
    open_price: '300.0',
    close_price: '300.0',
    period_high: '305.0',
    period_low: '295.0',
    pct_change: 0.0,
};

describe('ReportCard', () => {
    it('renders ticker, report ID, and all pricing metrics correctly', () => {
        render(<ReportCard report={mockPositiveReport}/>);

        expect(screen.getByText('AAPL')).toBeInTheDocument();
        expect(screen.getByText('Report #101')).toBeInTheDocument();

        expect(screen.getByText('150.0')).toBeInTheDocument();
        expect(screen.getByText('157.5')).toBeInTheDocument();
        expect(screen.getByText('160.0')).toBeInTheDocument();
        expect(screen.getByText('148.5')).toBeInTheDocument();
    });

    it('renders positive percentage change with a plus sign and default badge styling', () => {
        render(<ReportCard report={mockPositiveReport} />);

        expect(
            screen.getByText((_, el) => el?.textContent?.replace(/\s+/g, ' ').trim() === '+ 5.00%')
        ).toBeInTheDocument();
    });

    it('renders negative percentage change without a plus sign', () => {
        render(<ReportCard report={mockNegativeReport}/>);

         expect(
            screen.getByText((_, el) => el?.textContent?.replace(/\s+/g, ' ').trim() === '-10.00%')
        ).toBeInTheDocument();
    });

    it('handles zero percentage change correctly with plus', () => {
        render(<ReportCard report={mockZeroReport}/>);

        expect(
            screen.getByText((_, el) => el?.textContent?.replace(/\s+/g, ' ').trim() === '+ 0.00%')
        ).toBeInTheDocument();
    })
});