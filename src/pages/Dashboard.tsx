import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePayments } from '@/hooks/usePayments'
import Header from '@/components/Header'
import DashboardStats from '@/components/DashboardStats'
import PaymentButtons from '@/components/PaymentButtons'
import CustomPaymentForm from '@/components/CustomPaymentForm'
import PaymentHistory from '@/components/PaymentHistory'
import ExportButton from '@/components/ExportButton'
import UserManagement from '@/components/UserManagement'

export default function Dashboard() {
  const { profile } = useAuth()
  const paymentsHook = usePayments()
  const [showUserMgmt, setShowUserMgmt] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onUserManagement={() => setShowUserMgmt(true)} />
      <main className="container mx-auto px-4 py-6 space-y-8">
        <DashboardStats stats={paymentsHook.stats} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <PaymentButtons onPay={(amount) => paymentsHook.addPayment(amount, {})} />
            <CustomPaymentForm onPay={(amount, details) => paymentsHook.addPayment(amount, details)} />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Payment History</h2>
              <ExportButton paymentsHook={paymentsHook} />
            </div>
            <PaymentHistory paymentsHook={paymentsHook} />
          </div>
        </div>
      </main>
      {profile?.role === 'admin' && showUserMgmt && (
        <UserManagement onClose={() => setShowUserMgmt(false)} />
      )}
    </div>
  )
}