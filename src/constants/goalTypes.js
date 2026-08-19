export const GOAL_TYPES = [
  { value: 'emergency_fund', label: 'Emergency Fund' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'car', label: 'Car' },
  { value: 'house', label: 'House' },
  { value: 'education', label: 'Education' },
  { value: 'investment', label: 'Investment' },
  { value: 'personal', label: 'Personal Purchase' },
  { value: 'other', label: 'Other' },
]

export const GOAL_TYPE_CODES = GOAL_TYPES.map((goalType) => goalType.value)

export const GOAL_TYPE_MAP = Object.fromEntries(GOAL_TYPES.map((goalType) => [goalType.value, goalType]))
