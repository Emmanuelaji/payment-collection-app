import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { formatNaira } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import VoidConfirmationDialog from './VoidConfirmationDialog'
import { useState } from 'react'
import { Payment } from '@/types/database'
import { useAuth } from '@/hooks/useAuth'

interface PaymentsHook {
  payments: Payment[]
  loading: boolean
  search: string; setSearch: (v: string) => void
  dateFrom: string; setDateFrom: (v: string) => void
  dateTo: string; setDateTo: (v: string) => void
  statusFilter: string; setStatusFilter: (v: any) => void
  page: number; setPage: (p: number) => void
  pageSize: number; setPageSize: (s: number) => void
  totalCount: number
  voidPayment: (id: string) => Promise<any>
}

export default function PaymentHistory({ paymentsHook }: { paymentsHook: PaymentsHook }) {
  const { profile } = useAuth()
  const [voidId, setVoidId] = useState<string | null>(null)
  const { payments, loading, search, setSearch, dateFrom, setDateFrom, dateTo, setDateTo,
    statusFilter, setStatusFilter, page, setPage, pageSize, setPageSize, totalCount } = paymentsHook

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input placeholder="Search transactions..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-8" />
        </div>
        <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="w-40" />
        <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className="w-40" />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="voided">Voided</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No payments found.</div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.transaction_id}</TableCell>
                    <TableCell>{format(new Date(p.created_at), 'dd MMM yyyy, HH:mm')}</TableCell>
                    <TableCell>
                      <div>{p.customer_name || '-'}</div>
                      <div className="text-xs text-gray-500">{p.customer_phone || ''}</div>
                    </TableCell>
                    <TableCell>{formatNaira(p.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'paid' ? 'default' : 'destructive'}>
                        {p.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {profile?.role === 'admin' && p.status === 'paid' && (
                        <Button variant="outline" size="sm" onClick={() => setVoidId(p.id)}>Void</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {payments.map((p) => (
              <div key={p.id} className="border rounded p-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs font-mono">{p.transaction_id}</span>
                  <Badge variant={p.status === 'paid' ? 'default' : 'destructive'}>{p.status}</Badge>
                </div>
                <div className="text-sm">{p.customer_name || 'No name'}</div>
                <div className="font-bold">{formatNaira(p.amount)}</div>
                <div className="text-xs text-gray-500">{format(new Date(p.created_at), 'PPp')}</div>
                {profile?.role === 'admin' && p.status === 'paid' && (
                  <Button variant="outline" size="sm" onClick={() => setVoidId(p.id)}>Void</Button>
                )}
              </div>
            ))}
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-sm">
              <span>Rows per page:</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">Page {page} of {totalPages}</span>
              <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
      {voidId && (
        <VoidConfirmationDialog
          payment={payments.find(p => p.id === voidId)!}
          onConfirm={async () => { await paymentsHook.voidPayment(voidId); setVoidId(null) }}
          onCancel={() => setVoidId(null)}
        />
      )}
    </div>
  )
}