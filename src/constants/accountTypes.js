// Balance sign convention: for 'asset' types, a positive balance is wealth.
// For 'liability' types (credit_card), a positive balance is an amount owed —
// never stored as negative. 'other' is unclassified and excluded from
// asset/liability totals until the user tells us otherwise.
export const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Bank Account', description: 'Checking or savings account', classification: 'asset' },
  { value: 'cash', label: 'Cash', description: 'Physical cash on hand', classification: 'asset' },
  {
    value: 'credit_card',
    label: 'Credit Card',
    description: 'Amount currently owed on a credit card',
    classification: 'liability',
  },
  {
    value: 'investment',
    label: 'Investment',
    description: 'Brokerage, retirement, or other investment account',
    classification: 'asset',
  },
  { value: 'other', label: 'Other', description: 'Anything that does not fit the above', classification: 'unknown' },
]

export const ACCOUNT_TYPE_CODES = ACCOUNT_TYPES.map((accountType) => accountType.value)

export const ACCOUNT_TYPE_MAP = Object.fromEntries(ACCOUNT_TYPES.map((accountType) => [accountType.value, accountType]))

export const getAccountClassification = (type) => ACCOUNT_TYPE_MAP[type]?.classification ?? 'unknown'

// Shared by AccountCard, NetWorthAccountRow, and NetWorthAccountList so
// account rows use the same type icon everywhere rather than a second
// mapping — lives here (not in a component file) so those files only ever
// export components, which is what React Fast Refresh requires.
export const ACCOUNT_TYPE_ICON = {
  bank: 'building',
  cash: 'banknote',
  credit_card: 'creditCard',
  investment: 'chartCandlestick',
  other: 'wallet',
}
