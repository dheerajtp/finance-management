import Input from '../../ui/Input'
import Select from '../../ui/Select'
import Button from '../../ui/Button'
import { categoryInputs, essentialToggleInput } from '../../../inputs/categories/category.inputs'
import styles from './CategoryForm.module.css'

const CategoryForm = ({ register, onSubmit, errors, saving, watchedType, submitLabel = 'Save category' }) => {
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      {categoryInputs.map((field) =>
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
            error={errors[field.name]?.message}
            {...register(field.name)}
          />
        ),
      )}

      {watchedType === 'expense' && (
        <label className={styles.checkboxRow} htmlFor={essentialToggleInput.name}>
          <input id={essentialToggleInput.name} type="checkbox" {...register(essentialToggleInput.name)} />
          {essentialToggleInput.label}
        </label>
      )}

      <Button type="submit" loading={saving} className={styles.submit}>
        {submitLabel}
      </Button>
    </form>
  )
}

export default CategoryForm
