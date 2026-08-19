import { CATEGORY_TYPES } from '../../constants/categoryTypes'

const categoryTypeOptions = CATEGORY_TYPES.map(({ value, label }) => ({ value, label }))

export const categoryInputs = [
  { name: 'name', label: 'Category name', type: 'text', autoComplete: 'off' },
  { name: 'type', label: 'Category type', type: 'select', placeholder: 'Select type', options: categoryTypeOptions },
]

// Rendered conditionally — only meaningful when type = 'expense'. See
// useActionCategory.js for the type → is_essential reset dependency.
export const essentialToggleInput = {
  name: 'is_essential',
  label: 'This is an essential expense',
}
