import Input from '../../ui/Input'
import Select from '../../ui/Select'
import Button from '../../ui/Button'
import { INVESTMENT_FREQUENCIES } from '../../../constants/investmentFrequencies'
import { CURRENCIES } from '../../../constants/currencies'
import { investmentPlanFieldLabels as labels } from '../../../inputs/investments/investment.inputs'
import styles from './InvestmentPlanForm.module.css'

const currencyOptions = CURRENCIES.map(({ code, name }) => ({ value: code, label: `${code} — ${name}` }))

const InvestmentPlanForm = ({ register, onSubmit, errors, saving, watchedFrequency, submitLabel = 'Save SIP' }) => (
  <form onSubmit={onSubmit} className={styles.form}>
    <Input id="name" label={labels.name} type="text" error={errors.name?.message} {...register('name')} />

    <Input id="amount" label={labels.amount} type="number" step="0.01" error={errors.amount?.message} {...register('amount')} />

    <Select
      id="currency"
      label={labels.currency}
      options={currencyOptions}
      disabled
      helperText="Follows the investment holding"
      error={errors.currency?.message}
      {...register('currency')}
    />

    <Select
      id="frequency"
      label={labels.frequency}
      placeholder="Select frequency"
      options={INVESTMENT_FREQUENCIES}
      error={errors.frequency?.message}
      {...register('frequency')}
    />

    <Input
      id="contribution_day"
      label={labels.contributionDay}
      type="number"
      min="1"
      max="31"
      helperText={
        watchedFrequency === 'monthly'
          ? 'Day of the month (1–31) — required for monthly plans'
          : 'Optional day of the month (1–31)'
      }
      error={errors.contribution_day?.message}
      {...register('contribution_day')}
    />

    <Input id="start_date" label={labels.startDate} type="date" error={errors.start_date?.message} {...register('start_date')} />

    <Input
      id="end_date"
      label={labels.endDate}
      type="date"
      helperText="Optional — a SIP may continue indefinitely"
      error={errors.end_date?.message}
      {...register('end_date')}
    />

    <Button type="submit" loading={saving} className={styles.submit}>
      {submitLabel}
    </Button>
  </form>
)

export default InvestmentPlanForm
