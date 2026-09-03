import { render, screen, fireEvent, } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReportView } from '@/components/ReportView';

import { useReports } from '@/hooks/useReports';

jest.mock('@/hooks/useReports', () => ({
    useReports: jest.fn(),
}))

jest.mock('@/components/ReportCard', () => ({
    ReportCard: ({ report }: { report: any }) => (
        <div data-testid='report-card'>{report.ticker}</div>
    ),
}));

const mockReports = [
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

        (useReports as jest.Mock).mockReturnValue({
            reports: [],
            loading: false,
            error: null,
            createReport: mockCreateReport,
        });
    })

    describe('ReportView content present', () => {
        it('renders report content', async () => {
            (useReports as jest.Mock).mockReturnValue({
                reports: mockReports,
                loading: false,
                error: null,
                createReport: mockCreateReport,
            });

            render(
                <ReportView />
            );

            expect(screen.getByText('AAPL')).toBeInTheDocument();
            expect(screen.getByText('GOOGL')).toBeInTheDocument();
        });

        it('shows loading state', async () => {
            (useReports as jest.Mock).mockReturnValue({
                reports: [],
                loading: true,
                error: null,
                createReport: mockCreateReport,
            });

            render(
                <ReportView />
            );

            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });

        it('shows error state', async () => {
            (useReports as jest.Mock).mockReturnValue({
                reports: [],
                loading: false,
                error: 'Something went wrong',
                createReport: mockCreateReport,
            });
            
            render(<ReportView />);

            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        });

        it('shows no reports generated when reports array is emprty', () => {
            (useReports as jest.Mock).mockReturnValue({
                reports: [],
                loading: false,
                error: null,
                createReport: mockCreateReport,
            });

            render(<ReportView />);

            expect(screen.getByText('No reports generated yet.')).toBeInTheDocument();
        })
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