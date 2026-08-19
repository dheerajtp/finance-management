import Input from '../../ui/Input'
import Select from '../../ui/Select'
import Button from '../../ui/Button'
import { CURRENCIES } from '../../../constants/currencies'
import { BILLING_FREQUENCIES } from '../../../constants/subscriptionFrequency'
import { subscriptionFieldLabels as labels } from '../../../inputs/subscriptions/subscription.inputs'
import styles from './SubscriptionForm.module.css'

const currencyOptions = CURRENCIES.map(({ code, name }) => ({ value: code, label: `${code} — ${name}` }))

const SubscriptionForm = ({
  register,
  onSubmit,
  errors,
  saving,
  accountOptions,
  categoryOptions,
  submitLabel = 'Save subscription',
}) => {
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <Input id="name" label={labels.name} type="text" error={errors.name?.message} {...register('name')} />

      <Input
        id="description"
        label={labels.description}
        type="text"
        helperText="Optional"
        error={errors.description?.message}
        {...register('description')}
      />

      <Input id="amount" label={labels.amount} type="number" error={errors.amount?.message} {...register('amount')} />

      <Select
        id="currency"
        label={labels.currency}
        placeholder="Select currency"
        options={currencyOptions}
        error={errors.currency?.message}
        {...register('currency')}
      />

      <Select
        id="billing_frequency"
        label={labels.billingFrequency}
        placeholder="Select frequency"
        options={BILLING_FREQUENCIES}
        error={errors.billing_frequency?.message}
        {...register('billing_frequency')}
      />

      <Input
        id="next_billing_date"
        label={labels.nextBillingDate}
        type="date"
        error={errors.next_billing_date?.message}
        {...register('next_billing_date')}
      />

      <Select
        id="account_id"
        label={labels.account}
        options={accountOptions}
        helperText="Optional"
        error={errors.account_id?.message}
        {...register('account_id')}
      />

      <Select
        id="category_id"
        label={labels.category}
        options={categoryOptions}
        helperText="Defaults to your Subscriptions category — change it if this belongs elsewhere"
        error={errors.category_id?.message}
        {...register('category_id')}
      />

      <Button type="submit" loading={saving} className={styles.submit}>
        {submitLabel}
      </Button>
    </form>
  )
}

export default SubscriptionForm
