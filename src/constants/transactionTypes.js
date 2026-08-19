export const TRANSACTION_TYPES = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'investment', label: 'Investment' },
  { value: 'transfer', label: 'Transfer' },
]

export const TRANSACTION_TYPE_CODES = TRANSACTION_TYPES.map((transactionType) => transactionType.value)
