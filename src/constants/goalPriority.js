// Ordering only — not a measure of financial importance or advice.
export const GOAL_PRIORITIES = [
  { value: 1, label: 'High' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'Low' },
]

export const GOAL_PRIORITY_CODES = GOAL_PRIORITIES.map((priority) => priority.value)

export const GOAL_PRIORITY_MAP = Object.fromEntries(GOAL_PRIORITIES.map((priority) => [priority.value, priority]))

export const DEFAULT_GOAL_PRIORITY = 2
