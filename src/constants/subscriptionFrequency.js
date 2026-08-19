export const BILLING_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

export const BILLING_FREQUENCY_CODES = BILLING_FREQUENCIES.map((frequency) => frequency.value)

export const BILLING_FREQUENCY_MAP = Object.fromEntries(
  BILLING_FREQUENCIES.map((frequency) => [frequency.value, frequency]),
)
