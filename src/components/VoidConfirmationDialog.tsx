import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Payment } from '@/types/database'
import { formatNaira } from '@/lib/utils'

export default function VoidConfirmationDialog({ payment, onConfirm, onCancel }: {
  payment: Payment; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Void Payment</DialogTitle>
          <DialogDescription>
            Are you sure you want to void this payment? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1 text-sm">
          <p>Transaction: <span className="font-mono">{payment.transaction_id}</span></p>
          <p>Amount: <strong>{formatNaira(payment.amount)}</strong></p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Void Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}