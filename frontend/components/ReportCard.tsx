import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ReportCard() {

    return (
        <Card>
            <CardHeader>
                <CardTitle>Title</CardTitle>
                <Badge>Badge here</Badge>
            </CardHeader>
            <CardContent>
                <p>Card Content</p>
            </CardContent>
            <CardFooter>
                <p>Card Footer</p>
            </CardFooter>
        </Card>
    )
}