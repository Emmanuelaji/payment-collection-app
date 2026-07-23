import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { exportToExcel } from '@/lib/excelExport'
import { useState } from 'react'
import { Payment } from '@/types/database'
import { supabase } from '@/lib/supabase'

export default function ExportButton({ paymentsHook }: { paymentsHook: any }) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)

    let query = supabase
      .from('payments')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })

    // Use the same debounced search term as the displayed history
    if (paymentsHook.debouncedSearch) {
      const term = `%${paymentsHook.debouncedSearch}%`
      query = query.or(
        `transaction_id.ilike.${term},customer_name.ilike.${term},customer_phone.ilike.${term},description.ilike.${term},reference.ilike.${term}`
      )
    }
    if (paymentsHook.dateFrom) query = query.gte('created_at', paymentsHook.dateFrom)
    if (paymentsHook.dateTo) query = query.lte('created_at', paymentsHook.dateTo + 'T23:59:59')
    if (paymentsHook.statusFilter !== 'all') query = query.eq('status', paymentsHook.statusFilter)

    const { data } = await query
    if (data) {
      exportToExcel(data as Payment[])
    } else {
      // still export an empty sheet with headers
      exportToExcel([])
    }
    setExporting(false)
  }

  return (
    <Button onClick={handleExport} disabled={exporting} variant="outline">
      <Download className="mr-2 h-4 w-4" /> {exporting ? 'Exporting...' : 'Export Excel'}
    </Button>
  )
}