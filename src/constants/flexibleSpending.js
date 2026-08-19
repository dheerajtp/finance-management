// The 6 flexible-spending planning buckets — fixed, not user-defined (see
// Task 25 spec). These are a planning-only concept layered on top of the
// existing expense categories; they are never a second transaction
// category system.
export const FLEXIBLE_CATEGORIES = [
  { key: 'food', label: 'Food & Dining' },
  { key: 'travel', label: 'Travel' },
  { key: 'entertainment', label: 'Entertainment' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'personal', label: 'Personal' },
  { key: 'other', label: 'Other' },
]

export const FLEXIBLE_CATEGORY_KEYS = FLEXIBLE_CATEGORIES.map((category) => category.key)

export const FLEXIBLE_CATEGORY_LABEL = Object.fromEntries(FLEXIBLE_CATEGORIES.map((category) => [category.key, category.label]))

// Sensible starting point only — never presented as financial advice, and
// fully editable (see AllocationForm). Matches the example split in the
// task spec.
export const DEFAULT_ALLOCATION_PERCENTAGES = {
  food: 30,
  travel: 20,
  entertainment: 15,
  shopping: 15,
  personal: 10,
  other: 10,
}

// Maps the DEFAULT seeded discretionary category names (see 0004 migration)
// to a flexible bucket — same "known name -> semantic key, unknown name
// falls back" approach already used by constants/categoryIcons.js. Any
// category not listed here (a custom category, or an essential one that
// somehow appears) falls back to 'other' rather than being discarded.
const FLEXIBLE_GROUP_BY_CATEGORY_NAME = {
  'Dining Out': 'food',
  Groceries: 'food',
  Shopping: 'shopping',
  Entertainment: 'entertainment',
  Hobbies: 'entertainment',
  Travel: 'travel',
  Subscriptions: 'other',
  'Other Discretionary': 'other',
}

export const getFlexibleGroupForCategory = (category) =>
  (category && FLEXIBLE_GROUP_BY_CATEGORY_NAME[category.name]) || 'other'
