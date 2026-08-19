export const INVESTMENT_TYPES = [
  { value: 'mutual_fund', label: 'Mutual Fund' },
  { value: 'stock', label: 'Stock' },
  { value: 'etf', label: 'ETF' },
  { value: 'bond', label: 'Bond' },
  { value: 'ppf', label: 'PPF' },
  { value: 'nps', label: 'NPS' },
  { value: 'fd', label: 'Fixed Deposit' },
  { value: 'gold', label: 'Gold' },
  { value: 'other', label: 'Other' },
]

export const INVESTMENT_TYPE_CODES = INVESTMENT_TYPES.map((type) => type.value)

export const INVESTMENT_TYPE_MAP = Object.fromEntries(INVESTMENT_TYPES.map((type) => [type.value, type]))
