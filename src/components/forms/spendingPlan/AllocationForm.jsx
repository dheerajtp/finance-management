import Input from '../../ui/Input'
import Button from '../../ui/Button'
import { FLEXIBLE_CATEGORIES } from '../../../constants/flexibleSpending'
import { allocationFieldLabels as labels } from '../../../inputs/spendingPlan/spendingPlan.inputs'
import styles from './AllocationForm.module.css'

// Purely a form — the 100% total/remaining feedback shown below the fields
// is passed in already-calculated (see useActionSpendingPlan /
// calculateAllocationTotalPercentage), never computed here.
const AllocationForm = ({ register, onSubmit, errors, saving, totalPercentage, submitLabel = 'Save allocation' }) => (
  <form onSubmit={onSubmit} className={styles.form}>
    <p className="text-secondary">
      Decide how your safe-to-spend amount is split across flexible categories. These are starting points you can change
      anytime.
    </p>

    <div className={styles.grid}>
      {FLEXIBLE_CATEGORIES.map((category) => {
        const field = `${category.key}_percentage`
        return (
          <Input
            key={field}
            id={field}
            label={labels[field]}
            type="number"
            min="0"
            max="100"
            step="1"
            suffix="%"
            error={errors[field]?.message}
            {...register(field)}
          />
        )
      })}
    </div>

    {totalPercentage > 100 ? (
      <p role="alert" className={styles.overTotal}>
        Your allocations exceed 100%.
      </p>
    ) : (
      <p className="text-caption">
        Total allocated: {totalPercentage}%{totalPercentage < 100 ? ` — ${100 - totalPercentage}% will remain unallocated` : ''}
      </p>
    )}

    <Button type="submit" loading={saving} className={styles.submit}>
      {submitLabel}
    </Button>
  </form>
)

export default AllocationForm
