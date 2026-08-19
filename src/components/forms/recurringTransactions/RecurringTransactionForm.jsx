import Input from '../../ui/Input'
import Select from '../../ui/Select'
import Button from '../../ui/Button'
import { CURRENCIES } from '../../../constants/currencies'
import { RECURRING_FREQUENCIES } from '../../../constants/recurringFrequency'
import {
  recurringTransactionTypeOptions,
  recurringTransactionFieldLabels as labels,
} from '../../../inputs/recurringTransactions/recurringTransaction.inputs'
import styles from './RecurringTransactionForm.module.css'

const currencyOptions = CURRENCIES.map(({ code, name }) => ({ value: code, label: `${code} — ${name}` }))

const RecurringTransactionForm = ({
  register,
  onSubmit,
  errors,
  saving,
  watchedType,
  accountOptions,
  destinationAccountOptions,
  categoryOptions,
  subscriptionOptions,
  onApplySubscription,
  submitLabel = 'Save recurring transaction',
}) => {
  const isTransfer = watchedType === 'transfer'

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      {subscriptionOptions.length > 0 && (
        <Select
          id="related_subscription"
          label={labels.relatedSubscription}
          placeholder="None — fill in manually"
          options={subscriptionOptions}
          helperText="Optional — prefills the fields below, you can still edit them"
          onChange={(event) => onApplySubscription(event.target.value)}
        />
      )}

      <Select
        id="type"
        label={labels.type}
        options={recurringTransactionTypeOptions}
        error={errors.type?.message}
        {...register('type')}
      />

      <Select
        id="account_id"
        label={isTransfer ? labels.fromAccount : labels.account}
        placeholder="Select account"
        options={accountOptions}
        error={errors.account_id?.message}
        {...register('account_id')}
      />

      {isTransfer ? (
        <Select
          id="destination_account_id"
          label={labels.toAccount}
          placeholder="Select destination account"
          options={destinationAccountOptions}
          error={errors.destination_account_id?.message}
          {...register('destination_account_id')}
        />
      ) : (
        <Select
          id="category_id"
          label={labels.category}
          placeholder="Select category"
          options={categoryOptions}
          error={errors.category_id?.message}
          {...register('category_id')}
        />
      )}

      <Input id="amount" label={labels.amount} type="number" error={errors.amount?.message} {...register('amount')} />

      <Select
        id="currency"
        label={labels.currency}
        options={currencyOptions}
        disabled
        helperText="Follows the selected account"
        error={errors.currency?.message}
        {...register('currency')}
      />

      <Input
        id="description"
        label={labels.description}
        type="text"
        helperText="Optional"
        error={errors.description?.message}
        {...register('description')}
      />

      <Select
        id="frequency"
        label={labels.frequency}
        placeholder="Select frequency"
        options={RECURRING_FREQUENCIES}
        error={errors.frequency?.message}
        {...register('frequency')}
      />

      <Input
        id="start_date"
        label={labels.startDate}
        type="date"
        error={errors.start_date?.message}
        {...register('start_date')}
      />

      <Input
        id="next_occurrence_date"
        label={labels.nextOccurrenceDate}
        type="date"
        error={errors.next_occurrence_date?.message}
        {...register('next_occurrence_date')}
      />

      <Input
        id="end_date"
        label={labels.endDate}
        type="date"
        helperText="Optional"
        error={errors.end_date?.message}
        {...register('end_date')}
      />

      <Button type="submit" loading={saving} className={styles.submit}>
        {submitLabel}
      </Button>
    </form>
  )
}

export default RecurringTransactionForm
