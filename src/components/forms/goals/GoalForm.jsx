import Input from '../../ui/Input'
import Select from '../../ui/Select'
import Button from '../../ui/Button'
import { goalInputs } from '../../../inputs/goals/goal.inputs'
import styles from './GoalForm.module.css'

const GoalForm = ({ register, onSubmit, errors, saving, submitLabel = 'Save goal' }) => {
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      {goalInputs.map((field) =>
        field.type === 'select' ? (
          <Select
            key={field.name}
            id={field.name}
            label={field.label}
            placeholder={field.placeholder}
            options={field.options}
            error={errors[field.name]?.message}
            {...register(field.name)}
          />
        ) : (
          <Input
            key={field.name}
            id={field.name}
            label={field.label}
            type={field.type}
            helperText={field.helperText}
            error={errors[field.name]?.message}
            {...register(field.name)}
          />
        ),
      )}
      <Button type="submit" loading={saving} className={styles.submit}>
        {submitLabel}
      </Button>
    </form>
  )
}

export default GoalForm
