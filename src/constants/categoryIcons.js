// Maps the default seeded category names (supabase/migrations/0004) to a
// semantic icon key from components/ui/Icon.jsx. User-created custom
// categories fall back to a generic icon by type — never inventing a
// per-category icon we don't actually know how to pick.
const CATEGORY_ICON_BY_NAME = {
  Salary: 'wallet',
  Freelance: 'laptop',
  Business: 'briefcase',
  Interest: 'percent',
  'Other Income': 'wallet',
  Housing: 'house',
  Utilities: 'zap',
  Groceries: 'shoppingBasket',
  Transportation: 'car',
  Healthcare: 'heartPulse',
  Insurance: 'shield',
  Education: 'graduationCap',
  'Other Essential': 'tag',
  'Dining Out': 'utensils',
  Shopping: 'shoppingBag',
  Entertainment: 'clapperboard',
  Subscriptions: 'refresh',
  Travel: 'plane',
  Hobbies: 'gamepad',
  'Other Discretionary': 'tag',
}

const FALLBACK_ICON_BY_TYPE = { income: 'wallet', expense: 'tag' }

export const getCategoryIcon = (category) =>
  CATEGORY_ICON_BY_NAME[category.name] ?? FALLBACK_ICON_BY_TYPE[category.type] ?? 'tag'
