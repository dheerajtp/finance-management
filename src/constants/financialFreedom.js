// FI multiplier: annual spending × multiplier = FI target. 25 = a 4%
// withdrawal-rate assumption. None of these is presented as universally
// correct — the user picks.
export const FI_MULTIPLIER_OPTIONS = [
  { value: 20, label: '20× (≈5% withdrawal)' },
  { value: 25, label: '25× (≈4% withdrawal)' },
  { value: 30, label: '30× (≈3.33% withdrawal)' },
]
export const FI_MULTIPLIER_CODES = FI_MULTIPLIER_OPTIONS.map((option) => option.value)
export const DEFAULT_FI_MULTIPLIER = 25

export const FI_ANALYSIS_MONTHS_OPTIONS = [
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months' },
]
export const FI_ANALYSIS_MONTHS_CODES = FI_ANALYSIS_MONTHS_OPTIONS.map((option) => option.value)
export const DEFAULT_FI_ANALYSIS_MONTHS = 6

export const FI_EXPECTED_RETURN_OPTIONS = [
  { value: 4, label: '4% (conservative)' },
  { value: 6, label: '6% (moderate)' },
  { value: 8, label: '8% (optimistic)' },
]
export const FI_EXPECTED_RETURN_CODES = FI_EXPECTED_RETURN_OPTIONS.map((option) => option.value)
export const DEFAULT_FI_EXPECTED_RETURN = 6

// Investment accounts count here (unlike the Emergency Fund module) — credit
// cards never do, and 'other' only if the user explicitly picks it, which
// isn't offered since 'other' isn't in this list.
export const FI_ELIGIBLE_ACCOUNT_TYPES = ['bank', 'cash', 'investment']

export const FI_SCENARIO_MULTIPLIERS = [1, 1.2, 1.5, 2]

export const FI_DISCRETIONARY_REDUCTION_OPTIONS = [0, 10, 20, 30]

// 100 years — hard ceiling so the projection loop can never run forever.
export const FI_MAX_PROJECTION_MONTHS = 1200
