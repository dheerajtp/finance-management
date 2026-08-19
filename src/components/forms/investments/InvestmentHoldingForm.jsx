import Input from '../../ui/Input'
import Select from '../../ui/Select'
import Button from '../../ui/Button'
import { INVESTMENT_TYPES } from '../../../constants/investmentTypes'
import { CURRENCIES } from '../../../constants/currencies'
import { investmentHoldingFieldLabels as labels } from '../../../inputs/investments/investment.inputs'
import styles from './InvestmentHoldingForm.module.css'

const currencyOptions = CURRENCIES.map(({ code, name }) => ({ value: code, label: `${code} — ${name}` }))

// Also the "existing investment" entry point — invested_amount/current_value
// are entered directly, no historical transactions required (see 0016
// migration notes).
const InvestmentHoldingForm = ({ register, onSubmit, errors, saving, accountOptions, submitLabel = 'Save investment' }) => (
  <form onSubmit={onSubmit} className={styles.form}>
    <Input id="name" label={labels.name} type="text" error={errors.name?.message} {...register('name')} />

    <Select
      id="type"
      label={labels.type}
      placeholder="Select investment type"
      options={INVESTMENT_TYPES}
      error={errors.type?.message}
      {...register('type')}
    />

    <Select
      id="account_id"
      label={labels.account}
      placeholder="Select investment account"
      options={accountOptions}
      error={errors.account_id?.message}
      {...register('account_id')}
    />

    <Select
      id="currency"
      label={labels.currency}
      placeholder="Select currency"
      options={currencyOptions}
      error={errors.currency?.message}
      {...register('currency')}
    />

    <Input
      id="invested_amount"
      label={labels.investedAmount}
      type="number"
      step="0.01"
      helperText="Total amount invested so far"
      error={errors.invested_amount?.message}
      {...register('invested_amount')}
    />

    <Input
      id="current_value"
      label={labels.currentValue}
      type="number"
      step="0.01"
      helperText="Current market value — you keep this up to date manually"
      error={errors.current_value?.message}
      {...register('current_value')}
    />

    <Button type="submit" loading={saving} className={styles.submit}>
      {submitLabel}
    </Button>
  </form>
)

export default InvestmentHoldingForm
