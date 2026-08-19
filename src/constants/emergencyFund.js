export const EMERGENCY_FUND_TARGET_MONTHS_OPTIONS = [
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 9, label: '9 months' },
  { value: 12, label: '12 months' },
]

export const EMERGENCY_FUND_TARGET_MONTHS_CODES = EMERGENCY_FUND_TARGET_MONTHS_OPTIONS.map((option) => option.value)

export const DEFAULT_EMERGENCY_FUND_TARGET_MONTHS = 6

// Completed months (current month always excluded) used to average essential
// monthly expenses.
export const ESSENTIAL_EXPENSE_BASELINE_MONTHS = 6

export const EMERGENCY_FUND_MILESTONES = [25, 50, 75, 100]

// Investment accounts aren't automatically emergency cash for this MVP, and
// a credit card can't represent savings — only bank/cash are selectable.
export const EMERGENCY_FUND_ELIGIBLE_ACCOUNT_TYPES = ['bank', 'cash']
