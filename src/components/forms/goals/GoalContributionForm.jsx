import Input from '../../ui/Input'
import Button from '../../ui/Button'
import { goalContributionInputs } from '../../../inputs/goals/goalContribution.inputs'
import styles from './GoalForm.module.css'

const GoalContributionForm = ({ register, onSubmit, errors, saving, submitLabel = 'Add contribution' }) => {
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      {goalContributionInputs.map((field) => (
        <Input
          key={field.name}
          id={field.name}
          label={field.label}
          type={field.type}
          helperText={field.helperText}
          error={errors[field.name]?.message}
          {...register(field.name)}
        />
      ))}
      <Button type="submit" loading={saving} className={styles.submit}>
        {submitLabel}
      </Button>
    </form>
  )
}

export default GoalContributionForm
