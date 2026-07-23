import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNaira } from '@/lib/utils'

export default function DashboardStats({ stats }: { stats: { todayAmount: number; todayCount: number; totalAmount: number; totalCount: number } }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Today's Collection" value={formatNaira(stats.todayAmount)} />
      <StatCard title="Today's Transactions" value={stats.todayCount.toString()} />
      <StatCard title="Total Collection" value={formatNaira(stats.totalAmount)} />
      <StatCard title="Total Transactions" value={stats.totalCount.toString()} />
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}