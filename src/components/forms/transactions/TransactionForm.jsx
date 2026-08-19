import Input from '../../ui/Input'
import Select from '../../ui/Select'
import Button from '../../ui/Button'
import { transactionTypeOptions, transactionFieldLabels as labels } from '../../../inputs/transactions/transaction.inputs'
import styles from './TransactionForm.module.css'

const TransactionForm = ({
  register,
  onSubmit,
  errors,
  saving,
  watchedType,
  accountOptions,
  destinationAccountOptions,
  categoryOptions,
  submitLabel = 'Save transaction',
}) => {
  const isTransfer = watchedType === 'transfer' || watchedType === 'investment'

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <Select id="type" label={labels.type} options={transactionTypeOptions} error={errors.type?.message} {...register('type')} />

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

      <Input
        id="amount"
        label={labels.amount}
        type="number"
        step="0.01"
        error={errors.amount?.message}
        {...register('amount')}
      />

      <Input
        id="description"
        label={labels.description}
        type="text"
        helperText="Optional"
        error={errors.description?.message}
        {...register('description')}
      />

      <Input
        id="transaction_date"
        label={labels.date}
        type="date"
        error={errors.transaction_date?.message}
        {...register('transaction_date')}
      />

      <Button type="submit" loading={saving} className={styles.submit}>
        {submitLabel}
      </Button>
    </form>
  )
}

export default TransactionForm
