import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Payment } from '@/types/database'
import { useAuth } from './useAuth'

export function usePayments() {
  const { user } = useAuth()
  const userIdRef = useRef(user?.id)

  // Keep the ref in sync with the actual user id
  useEffect(() => {
    userIdRef.current = user?.id
  }, [user])

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'voided'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  const [stats, setStats] = useState({ todayAmount: 0, todayCount: 0, totalAmount: 0, totalCount: 0 })

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchPayments = useCallback(async () => {
    const uid = userIdRef.current
    if (!uid) return
    setLoading(true)

    let query = supabase
      .from('payments')
      .select('*, profiles(full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (debouncedSearch) {
      const term = `%${debouncedSearch}%`
      query = query.or(
        `transaction_id.ilike.${term},customer_name.ilike.${term},customer_phone.ilike.${term},description.ilike.${term},reference.ilike.${term}`
      )
    }
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')
    if (statusFilter !== 'all') query = query.eq('status', statusFilter)

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query
    if (!error) {
      setPayments(data as unknown as Payment[])
      setTotalCount(count ?? 0)
    }
    setLoading(false)
  }, [debouncedSearch, dateFrom, dateTo, statusFilter, page, pageSize])

  const fetchStats = useCallback(async () => {
    const uid = userIdRef.current
    if (!uid) return

    const today = new Date().toISOString().split('T')[0]
    const { data: todayData } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')
      .gte('created_at', today)
      .lt('created_at', today + 'T23:59:59')
    const { count: todayCount } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'paid')
      .gte('created_at', today)
      .lt('created_at', today + 'T23:59:59')
    const { data: allData } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')
    const { count: allCount } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'paid')

    setStats({
      todayAmount: todayData?.reduce((sum, p) => sum + p.amount, 0) ?? 0,
      todayCount: todayCount ?? 0,
      totalAmount: allData?.reduce((sum, p) => sum + p.amount, 0) ?? 0,
      totalCount: allCount ?? 0,
    })
  }, [])  // no dependencies → stable reference

  useEffect(() => {
    fetchPayments()
    fetchStats()
  }, [fetchPayments, fetchStats])

  const addPayment = async (amount: number, details: { customer_name?: string; customer_phone?: string; description?: string; reference?: string }) => {
    // Always use a fresh session to avoid using a stale token
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'Session expired – please log in again' }
    const uid = session.user.id

    const { error } = await supabase.from('payments').insert({
      amount,
      customer_name: details.customer_name || null,
      customer_phone: details.customer_phone || null,
      description: details.description || null,
      reference: details.reference || null,
      created_by: uid,
      status: 'paid',
    })

    if (!error) {
      await fetchPayments()
      await fetchStats()
    }
    return { error }
  }

  const voidPayment = async (paymentId: string) => {
    const { error } = await supabase
      .from('payments')
      .update({ status: 'voided' })
      .eq('id', paymentId)
      .eq('status', 'paid')
    if (!error) {
      await fetchPayments()
      await fetchStats()
    }
    return { error }
  }

  return {
    payments, loading, search, setSearch, debouncedSearch,
    dateFrom, setDateFrom, dateTo, setDateTo,
    statusFilter, setStatusFilter, page, setPage, pageSize, setPageSize, totalCount,
    stats, addPayment, voidPayment, refresh: fetchPayments,
}
}