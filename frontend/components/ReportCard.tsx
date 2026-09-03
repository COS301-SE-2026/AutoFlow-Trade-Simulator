import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Reports } from '@/hooks/useReports'

interface ReportCardProps {
    report: Reports
}

export function ReportCard({ report }: ReportCardProps) {
    const isPositive = report.pct_change >= 0

    return (
        <Card className='w-full'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle> {report.ticker} </CardTitle>
                <Badge variant={isPositive ? 'default' : 'destructive'}>
                    {isPositive ? '+' : ''} {report.pct_change.toFixed(2)}%
                </Badge>
            </CardHeader>
            <CardContent className='grid grid-cols-2 gap-x-4 gap-y-2 text-sm'>
                <div>Open</div>
                <div className='text-right'>{report.open_price}</div>

                <div>Close</div>
                <div className='text-right'>{report.close_price}</div>

                <div>Period High</div>
                <div className='text-right'>{report.period_high}</div>

                <div>Period Low</div>
                <div className='text-right'>{report.period_low}</div>
            </CardContent>
            <CardFooter className='text-xs pt-2'>
                Report #{report.report_id}
            </CardFooter>
        </Card>
    )
}