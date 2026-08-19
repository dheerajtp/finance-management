import Input from '../../ui/Input'
import Select from '../../ui/Select'
import Button from '../../ui/Button'
import styles from './GoalTransactionAllocationForm.module.css'

// Used from two contexts: the goal detail page (transaction is picked, goal
// is fixed) and the transaction allocate flow (goal is picked, transaction
// is fixed) — exactly one of transactionOptions/goalOptions is passed in.
// Editing only ever touches amount/note (see task notes on why the
// relationship itself is locked after creation), so the picker is hidden
// entirely once isEditing is true.
const GoalTransactionAllocationForm = ({
  register,
  onSubmit,
  errors,
  saving,
  transactionOptions,
  goalOptions,
  isEditing,
  submitLabel = 'Add contribution',
}) => {
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      {!isEditing && transactionOptions && (
        <Select
          id="transaction_id"
          label="Transaction"
          placeholder={transactionOptions.length > 0 ? 'Select a transaction' : 'No eligible transactions found'}
          options={transactionOptions}
          error={errors.transaction_id?.message}
          {...register('transaction_id')}
        />
      )}

      {!isEditing && goalOptions && (
        <Select
          id="goal_id"
          label="Goal"
          placeholder={goalOptions.length > 0 ? 'Select a goal' : 'No eligible goals found'}
          options={goalOptions}
          error={errors.goal_id?.message}
          {...register('goal_id')}
        />
      )}

      <Input
        id="amount"
        label="Amount"
        type="number"
        step="0.01"
        error={errors.amount?.message}
        {...register('amount')}
      />

      <Input
        id="note"
        label="Note"
        type="text"
        helperText="Optional"
        error={errors.note?.message}
        {...register('note')}
      />

      <Button type="submit" loading={saving} className={styles.submit}>
        {submitLabel}
      </Button>
    </form>
  )
}

export default GoalTransactionAllocationForm
