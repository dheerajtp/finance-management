import Input from '../../ui/Input'
import Select from '../../ui/Select'
import Button from '../../ui/Button'
import { EMERGENCY_FUND_TARGET_MONTHS_OPTIONS } from '../../../constants/emergencyFund'
import { emergencyFundFieldLabels as labels } from '../../../inputs/emergencyFund/emergencyFund.inputs'
import styles from './EmergencyFundForm.module.css'

const EmergencyFundForm = ({ register, onSubmit, errors, saving, accountOptions, hasEligibleAccounts }) => {
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <p className={`text-caption ${styles.intro}`}>
        Your target is calculated from your average essential monthly expenses.
      </p>

      <div className={styles.row}>
        <Select
          id="target_months"
          label={labels.targetMonths}
          options={EMERGENCY_FUND_TARGET_MONTHS_OPTIONS}
          error={errors.target_months?.message}
          {...register('target_months')}
        />

        <Input
          id="monthly_contribution"
          label={labels.monthlyContribution}
          type="number"
          helperText="Optional — how much you plan to set aside each month"
          error={errors.monthly_contribution?.message}
          {...register('monthly_contribution')}
        />
      </div>

      <Select
        id="emergency_account_id"
        label={labels.emergencyAccount}
        placeholder={hasEligibleAccounts ? 'Select account' : 'No eligible accounts'}
        options={accountOptions}
        disabled={!hasEligibleAccounts}
        error={errors.emergency_account_id?.message}
        {...register('emergency_account_id')}
      />
      {!hasEligibleAccounts && (
        <p className="text-caption">
          Add an active bank or cash account in your profile currency to select it here.
        </p>
      )}

      <Button type="submit" loading={saving} className={styles.submit}>
        Save settings
      </Button>
    </form>
  )
}

export default EmergencyFundForm
