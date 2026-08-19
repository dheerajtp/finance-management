export const RECURRING_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

export const RECURRING_FREQUENCY_CODES = RECURRING_FREQUENCIES.map((frequency) => frequency.value)

export const RECURRING_FREQUENCY_MAP = Object.fromEntries(
  RECURRING_FREQUENCIES.map((frequency) => [frequency.value, frequency]),
)
