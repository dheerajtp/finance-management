import Input from '../../ui/Input'
import Select from '../../ui/Select'
import Button from '../../ui/Button'
import { CONTRIBUTION_STATUS_OPTIONS, investmentContributionFieldLabels as labels } from '../../../inputs/investments/investment.inputs'
import styles from './InvestmentContributionForm.module.css'

const InvestmentContributionForm = ({
  register,
  onSubmit,
  errors,
  saving,
  planOptions,
  isEditing,
  submitLabel = 'Record contribution',
}) => (
  <form onSubmit={onSubmit} className={styles.form}>
    {!isEditing && planOptions && planOptions.length > 0 && (
      <Select
        id="plan_id"
        label={labels.plan}
        placeholder="Not linked to a SIP"
        options={planOptions}
        helperText="Optional"
        error={errors.plan_id?.message}
        {...register('plan_id')}
      />
    )}

    <Input id="amount" label={labels.amount} type="number" error={errors.amount?.message} {...register('amount')} />

    <Input
      id="contribution_date"
      label={labels.contributionDate}
      type="date"
      error={errors.contribution_date?.message}
      {...register('contribution_date')}
    />

    <Select
      id="status"
      label={labels.status}
      options={CONTRIBUTION_STATUS_OPTIONS}
      error={errors.status?.message}
      {...register('status')}
    />

    <Input
      id="notes"
      label={labels.notes}
      type="text"
      helperText="Optional"
      error={errors.notes?.message}
      {...register('notes')}
    />

    <Button type="submit" loading={saving} className={styles.submit}>
      {submitLabel}
    </Button>
  </form>
)

export default InvestmentContributionForm
