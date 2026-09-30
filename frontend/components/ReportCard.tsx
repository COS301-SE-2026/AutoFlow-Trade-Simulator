import type { Reports } from '@/hooks/useReports'

interface ReportCardProps {
    report: Reports
}

export function ReportCard({ report }: ReportCardProps) {
    const isPositive = report.pct_change >= 0

    const rows: [string, string][] = [
        ['Open', report.open_price],
        ['Close', report.close_price],
        ['Period High', report.period_high],
        ['Period Low', report.period_low],
    ];

    return (
        <article className="flex flex-col rounded-2xl border border-[var(--border)] bg-[rgba(14,14,22,0.75)] p-5">
            <header className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-mono text-base font-semibold tracking-widest" translate="no">{report.ticker}</h3>
                <span
                    className={`tabular-nums rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isPositive ? 'bg-[rgba(0,148,68,0.15)] text-[var(--green-light)]' : 'bg-[rgba(237,28,36,0.15)] text-[#ff6b72]'
                    }`}
                >
                    {isPositive ? '+' : ''}{report.pct_change.toFixed(2)}%
                </span>
            </header>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {rows.map(([label, value]) => (
                    <div key={label} className="contents">
                        <dt className="text-white/55">{label}</dt>
                        <dd className="text-right tabular-nums">{value}</dd>
                    </div>
                ))}
            </dl>
            <footer className="mt-4 border-t border-[var(--border)] pt-3 text-xs text-white/40">
                Report #{report.report_id}
            </footer>
        </article>
    )
}
