import { GOAL_TYPES } from '../../constants/goalTypes'
import { GOAL_PRIORITIES } from '../../constants/goalPriority'
import { CURRENCIES } from '../../constants/currencies'

const currencyOptions = CURRENCIES.map(({ code, name }) => ({ value: code, label: `${code} — ${name}` }))

export const goalInputs = [
  { name: 'name', label: 'Goal name', type: 'text' },
  { name: 'type', label: 'Goal type', type: 'select', placeholder: 'Select type', options: GOAL_TYPES },
  { name: 'description', label: 'Description', type: 'text', helperText: 'Optional' },
  { name: 'target_amount', label: 'Target amount', type: 'number', step: '0.01', helperText: 'How much you need in total' },
  { name: 'currency', label: 'Currency', type: 'select', placeholder: 'Select currency', options: currencyOptions },
  { name: 'target_date', label: 'Target date', type: 'date', helperText: 'Optional' },
  { name: 'priority', label: 'Priority', type: 'select', placeholder: 'Select priority', options: GOAL_PRIORITIES },
]
