import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { Payment } from '@/types/database'

export function exportToExcel(payments: Payment[], filename?: string) {
  const rows = payments.map((p) => ({
    'Transaction ID': p.transaction_id,
    Date: format(new Date(p.created_at), 'dd/MM/yyyy'),
    Time: format(new Date(p.created_at), 'HH:mm'),
    'Customer Name': p.customer_name ?? '',
    'Phone Number': p.customer_phone ?? '',
    Description: p.description ?? '',
    Reference: p.reference ?? '',
    Amount: p.amount,
    Status: p.status.toUpperCase(),
    'Recorded By': (p as any).profiles?.full_name ?? 'Unknown',
    'Created At': p.created_at,
  }))

  // Calculate totals (only for non‑voided payments if you prefer, but currently includes all)
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalCount = payments.length

  // Create worksheet from rows
  const ws = XLSX.utils.json_to_sheet(rows)

  // Add summary rows after the data
  const summaryStartRow = rows.length + 2   // leave one empty row
  XLSX.utils.sheet_add_aoa(ws, [
    ['', '', '', '', '', '', 'Total Amount:', totalAmount, '', '', ''],
    ['', '', '', '', '', '', 'Total Transactions:', totalCount, '', '', ''],
  ], { origin: `A${summaryStartRow}` })

  // Adjust column widths
  ws['!cols'] = [
    { wch: 22 }, { wch: 12 }, { wch: 8 }, { wch: 20 }, { wch: 15 },
    { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 8 }, { wch: 20 }, { wch: 20 }
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Payments')

  const file = filename ?? `payment-records-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
  XLSX.writeFile(wb, file)
}