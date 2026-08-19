import Card from '../../ui/Card'
import Input from '../../ui/Input'
import Select from '../../ui/Select'
import Button from '../../ui/Button'
import { profileInputs } from '../../../inputs/profile/profile.inputs'
import styles from './ProfileForm.module.css'

const PERSONAL_FIELDS = ['name', 'currency']

const renderField = (field, register, errors) =>
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
  )

const ProfileForm = ({ register, onSubmit, errors, saving }) => {
  const personalFields = profileInputs.filter((field) => PERSONAL_FIELDS.includes(field.name))
  const financialFields = profileInputs.filter((field) => !PERSONAL_FIELDS.includes(field.name))

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <Card className={styles.section}>
        <p className="text-section-title">Personal Profile</p>
        <div className={styles.fields}>{personalFields.map((field) => renderField(field, register, errors))}</div>
      </Card>

      <Card className={styles.section}>
        <p className="text-section-title">Financial Baseline</p>
        <div className={styles.fields}>{financialFields.map((field) => renderField(field, register, errors))}</div>
      </Card>

      <Button type="submit" loading={saving} className={styles.submit}>
        Save profile
      </Button>
    </form>
  )
}

export default ProfileForm
