import { FLEXIBLE_CATEGORIES } from '../../constants/flexibleSpending'

export const allocationFieldLabels = Object.fromEntries(
  FLEXIBLE_CATEGORIES.map((category) => [`${category.key}_percentage`, category.label]),
)
