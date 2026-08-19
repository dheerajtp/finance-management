import { CURRENCIES } from '../../constants/currencies'

const currencyOptions = CURRENCIES.map(({ code, name }) => ({
  value: code,
  label: `${code} — ${name}`,
}))

export const profileInputs = [
  { name: 'name', label: 'Name', type: 'text', autoComplete: 'name' },
  {
    name: 'currency',
    label: 'Currency',
    type: 'select',
    placeholder: 'Select currency',
    options: currencyOptions,
  },
  {
    name: 'monthlyIncome',
    label: 'Monthly income',
    type: 'number',
    helperText: 'Your average take-home income per month',
  },
  {
    name: 'monthlySavingsTarget',
    label: 'Monthly savings target',
    type: 'number',
    helperText: 'How much you aim to save each month (optional)',
  },
]
