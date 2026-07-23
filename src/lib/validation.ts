import { z } from 'zod'

export const paymentFormSchema = z.object({
  amount: z.number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be positive')
    .max(999999999.99, 'Amount too large'),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  description: z.string().optional(),
  reference: z.string().optional(),
})

export type PaymentFormData = z.infer<typeof paymentFormSchema>