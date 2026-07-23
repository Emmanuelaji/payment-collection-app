import { Button } from '@/components/ui/button'
import { formatNaira } from '@/lib/utils'

const QUICK_PAYMENT_AMOUNTS = [100, 200, 500, 1000]

export default function PaymentButtons({ onPay }: { onPay: (amount: number) => Promise<any> }) {
  const [loadingAmount, setLoadingAmount] = useState<number | null>(null)

  const handleClick = async (amount: number) => {
    setLoadingAmount(amount)
    await onPay(amount)
    setLoadingAmount(null)
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {QUICK_PAYMENT_AMOUNTS.map((amount) => (
        <Button
          key={amount}
          variant="default"
          size="lg"
          className="h-20 text-xl font-semibold shadow-sm"
          onClick={() => handleClick(amount)}
          disabled={loadingAmount !== null}
          loading={loadingAmount === amount}
        >
          {loadingAmount === amount ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : null}
          PAID {formatNaira(amount)}
        </Button>
      ))}
    </div>
  )
}

// Need to import useState and Loader2
import { useState } from 'react'
import { Loader2 } from 'lucide-react'