import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { paymentFormSchema, PaymentFormData } from '@/lib/validation'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

export default function CustomPaymentForm({ onPay }: { onPay: (amount: number, details: PaymentFormData) => Promise<any> }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
  })

  const onSubmit = async (data: PaymentFormData) => {
    setLoading(true)
    const { error } = await onPay(data.amount, data)
    if (!error) {
      toast({ title: 'Payment recorded', description: `Amount: ₦${data.amount}` })
      reset()
    } else {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 bg-white p-4 rounded-lg shadow-sm border">
      <h3 className="font-medium">Enter Custom Amount</h3>
      <div>
        <label className="text-sm">Amount (₦)</label>
        <Input type="number" step="0.01" min="0.01" placeholder="0.00" {...register('amount', { valueAsNumber: true })} />
        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-gray-600">Add customer details (optional)</summary>
        <div className="mt-2 space-y-2">
          <Input placeholder="Customer Name" {...register('customer_name')} />
          <Input placeholder="Phone Number" {...register('customer_phone')} />
          <Input placeholder="Description" {...register('description')} />
          <Input placeholder="Reference / Note" {...register('reference')} />
        </div>
      </details>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        PAID
      </Button>
    </form>
  )
}