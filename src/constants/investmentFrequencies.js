export const INVESTMENT_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

export const INVESTMENT_FREQUENCY_CODES = INVESTMENT_FREQUENCIES.map((frequency) => frequency.value)

export const INVESTMENT_FREQUENCY_MAP = Object.fromEntries(
  INVESTMENT_FREQUENCIES.map((frequency) => [frequency.value, frequency]),
)
