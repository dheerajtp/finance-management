import { ACCOUNT_TYPES } from '../../constants/accountTypes'
import { CURRENCIES } from '../../constants/currencies'

const accountTypeOptions = ACCOUNT_TYPES.map(({ value, label }) => ({ value, label }))
const currencyOptions = CURRENCIES.map(({ code, name }) => ({ value: code, label: `${code} — ${name}` }))

export const accountInputs = [
  { name: 'name', label: 'Account name', type: 'text', autoComplete: 'off' },
  { name: 'type', label: 'Account type', type: 'select', placeholder: 'Select type', options: accountTypeOptions },
  {
    name: 'balance',
    label: 'Current balance',
    type: 'number',
    helperText: 'For credit cards, enter the amount currently owed',
  },
  { name: 'currency', label: 'Currency', type: 'select', placeholder: 'Select currency', options: currencyOptions },
]
