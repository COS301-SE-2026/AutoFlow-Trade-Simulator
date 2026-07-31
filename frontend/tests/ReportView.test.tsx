import { render, screen, fireEvent, } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReportView } from '@/components/ReportView';

import { useReports } from '@/hooks/useReports';

jest.mock('@/hooks/useReports', () => ({
    useReports: jest.fn(),
}))

const mockreports = [
    {
        id: 1,
        report_id: 1,
        ticker: 'AAPL',
        open_price: '150.00',
        close_price: '175.00',
        pct_change: 1,
        period_high: '180.00',
        period_low: '145.00'
    },
    {
        id: 2,
        report_id: 1,
        ticker: 'GOOGL',
        open_price: '150.00',
        close_price: '175.00',
        pct_change: 1,
        period_high: '180.00',
        period_low: '145.00'
    },
]

describe('ReportView', () => {
    const mockCreateReport = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    })

    describe('ReportView content present', () => {
        it('renders report content', async () => {
            jest.spyOn(require('@/hooks/useReports'), 'useReports').mockReturnValue({
                reports: mockreports,
                loading: false,
                error: null,
            });

            render(
                <ReportView />
            );

            expect(screen.getByText('AAPL')).toBeInTheDocument();
            expect(screen.getByText('GOOGL')).toBeInTheDocument();
        });

        it('shows loading state', async () => {
            jest.spyOn(require('@/hooks/useReports'), 'useReports').mockReturnValue({
                reports: [],
                loading: true,
                error: null,
            });

            render(
                <ReportView />
            );

            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });
    });

    describe('interactable features are functional', () => {
        it('buttons generate report', async () => {
            (useReports as jest.Mock).mockReturnValue({
                reports: [],
                loading: false,
                error: null,
                createReport: mockCreateReport
            })

            render(
                <ReportView />
            );

            const generateReportButton = screen.getByText('Generate Report');
            fireEvent.click(generateReportButton);

            expect(mockCreateReport).toHaveBeenCalledWith('daily');
        });
    });
})