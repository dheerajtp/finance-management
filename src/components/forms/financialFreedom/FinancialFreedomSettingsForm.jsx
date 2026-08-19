import Input from '../../ui/Input'
import Select from '../../ui/Select'
import Button from '../../ui/Button'
import {
  FI_ANALYSIS_MONTHS_OPTIONS,
  FI_MULTIPLIER_OPTIONS,
  FI_EXPECTED_RETURN_OPTIONS,
} from '../../../constants/financialFreedom'
import { financialFreedomFieldLabels as labels } from '../../../inputs/financialFreedom/financialFreedom.inputs'
import styles from './FinancialFreedomSettingsForm.module.css'

const FinancialFreedomSettingsForm = ({
  register,
  onSubmit,
  errors,
  saving,
  eligibleAccounts,
  selectedAccountIds,
  onToggleAccount,
}) => {
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <Select
        id="analysis_months"
        label={labels.analysisMonths}
        options={FI_ANALYSIS_MONTHS_OPTIONS}
        error={errors.analysis_months?.message}
        {...register('analysis_months')}
      />
      <Select
        id="fi_multiplier"
        label={labels.fiMultiplier}
        options={FI_MULTIPLIER_OPTIONS}
        error={errors.fi_multiplier?.message}
        {...register('fi_multiplier')}
      />
      <Select
        id="expected_annual_return"
        label={labels.expectedAnnualReturn}
        options={FI_EXPECTED_RETURN_OPTIONS}
        error={errors.expected_annual_return?.message}
        {...register('expected_annual_return')}
      />
      <Input
        id="monthly_contribution"
        label={labels.monthlyContribution}
        type="number"
        step="0.01"
        helperText="Defaults to your current monthly savings — override for planning"
        error={errors.monthly_contribution?.message}
        {...register('monthly_contribution')}
      />

      <div className={styles.accounts}>
        <p className="text-label">{labels.fiAccounts}</p>
        {eligibleAccounts.length === 0 && (
          <p className="text-caption">No eligible bank, cash, or investment accounts found.</p>
        )}
        {eligibleAccounts.map((account) => (
          <label key={account.id} className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={selectedAccountIds.includes(account.id)}
              onChange={() => onToggleAccount(account.id)}
            />
            {account.name} ({account.currency})
          </label>
        ))}
      </div>

      <Button type="submit" loading={saving} className={styles.submit}>
        Save settings
      </Button>
    </form>
  )
}

export default FinancialFreedomSettingsForm
