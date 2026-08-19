import Input from '../../ui/Input'
import Select from '../../ui/Select'
import Button from '../../ui/Button'
import { CURRENCIES } from '../../../constants/currencies'
import { budgetFieldLabels as labels } from '../../../inputs/budgets/budget.inputs'
import { formatCurrency } from '../../../utils/finance/currency'
import styles from './BudgetForm.module.css'

const currencyOptions = CURRENCIES.map(({ code, name }) => ({ value: code, label: `${code} — ${name}` }))

const BudgetForm = ({
  register,
  onSubmit,
  errors,
  saving,
  categoryOptions,
  suggestion,
  suggestionCurrency,
  onUseSuggestion,
  submitLabel = 'Save budget',
}) => {
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <Select
        id="category_id"
        label={labels.category}
        placeholder="Select category"
        options={categoryOptions}
        error={errors.category_id?.message}
        {...register('category_id')}
      />

      {suggestion?.average !== null && suggestion?.average !== undefined && (
        <p className={`text-caption ${styles.suggestion}`}>
          Based on your recent spending, your average is {formatCurrency(suggestion.average, suggestionCurrency)}
          /month.{' '}
          <button type="button" className={styles.suggestionLink} onClick={onUseSuggestion}>
            Use recent average as a starting point
          </button>
        </p>
      )}
      {suggestion && suggestion.average === null && (
        <p className={`text-caption ${styles.suggestion}`}>No recent spending history for this category.</p>
      )}

      <Input
        id="amount"
        label={labels.amount}
        type="number"
        step="0.01"
        error={errors.amount?.message}
        {...register('amount')}
      />
      <Select
        id="currency"
        label={labels.currency}
        placeholder="Select currency"
        options={currencyOptions}
        error={errors.currency?.message}
        {...register('currency')}
      />

      <Button type="submit" loading={saving} className={styles.submit}>
        {submitLabel}
      </Button>
    </form>
  )
}

export default BudgetForm
