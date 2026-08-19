import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/ui/PageHeader'
import Select from '../components/ui/Select'
import Skeleton from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import SubscriptionForm from '../components/forms/subscriptions/SubscriptionForm'
import SubscriptionCard from '../components/subscriptions/SubscriptionCard'
import SubscriptionSummary from '../components/subscriptions/SubscriptionSummary'
import UpcomingRenewals from '../components/subscriptions/UpcomingRenewals'
import useActionSubscription from '../hooks/functionality/useActionSubscription'
import { BILLING_FREQUENCIES } from '../constants/subscriptionFrequency'
import styles from './SubscriptionsPage.module.css'

const FREQUENCY_FILTER_OPTIONS = [{ value: 'all', label: 'All frequencies' }, ...BILLING_FREQUENCIES]

const SubscriptionsPage = () => {
  const {
    subscriptions,
    allSubscriptions,
    upcomingRenewals,
    summary,
    isLoading,
    isError,
    refetch,
    frequencyFilter,
    setFrequencyFilter,
    currencyFilter,
    setCurrencyFilter,
    currencyOptions,
    showInactive,
    setShowInactive,
    isFormOpen,
    isEditing,
    openCreateForm,
    openEditForm,
    closeForm,
    register,
    errors,
    onSubmit,
    saving,
    accountOptions,
    categoryOptions,
    pendingToggle,
    requestToggleActive,
    cancelToggleActive,
    confirmToggleActive,
    togglingActive,
  } = useActionSubscription()

  const currencyFilterOptions = [{ value: 'all', label: 'All currencies' }, ...currencyOptions]

  return (
    <div className={styles.page}>
      <PageHeader
        title="Subscriptions"
        description="Recurring commitments — what renews, when, and what it costs."
        actions={<Button onClick={openCreateForm}>
            <Icon name="plus" size="var(--icon-sm)" />
            Add Subscription
          </Button>}
      />

      <SubscriptionSummary summary={summary} loading={isLoading} />

      {!isLoading && !isError && <UpcomingRenewals subscriptions={upcomingRenewals} />}

      <div className={styles.filters}>
        <Select
          id="subscription-frequency-filter"
          label="Billing frequency"
          options={FREQUENCY_FILTER_OPTIONS}
          value={frequencyFilter}
          onChange={(event) => setFrequencyFilter(event.target.value)}
        />
        <Select
          id="subscription-currency-filter"
          label="Currency"
          options={currencyFilterOptions}
          value={currencyFilter}
          onChange={(event) => setCurrencyFilter(event.target.value)}
        />
        <label className={styles.toggle}>
          <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />
          Show inactive subscriptions
        </label>
      </div>

      {isLoading && (
        <div className={styles.grid}>
          <Skeleton height="12rem" radius="var(--radius-lg)" />
          <Skeleton height="12rem" radius="var(--radius-lg)" />
        </div>
      )}

      {!isLoading && isError && <ErrorState message="We couldn't load your subscriptions." onRetry={refetch} />}

      {!isLoading && !isError && allSubscriptions.length === 0 && (
        <EmptyState
          icon="refresh"
          title="Track your first recurring subscription."
          description="Netflix, gym memberships, SaaS tools — anything that bills you on a schedule."
          action={<Button onClick={openCreateForm}>
            <Icon name="plus" size="var(--icon-sm)" />
            Add Subscription
          </Button>}
        />
      )}

      {!isLoading && !isError && allSubscriptions.length > 0 && (
        <div className={styles.grid}>
          {subscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onEdit={openEditForm}
              onToggleActive={requestToggleActive}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={isEditing ? 'Edit Subscription' : 'Add Subscription'}
        icon={isEditing ? 'pencil' : 'refresh'}
        size="sm"
      >
        <SubscriptionForm
          register={register}
          onSubmit={onSubmit}
          errors={errors}
          saving={saving}
          accountOptions={accountOptions}
          categoryOptions={categoryOptions}
          submitLabel={isEditing ? 'Save changes' : 'Add subscription'}
        />
      </Modal>

      <ConfirmModal
        isOpen={Boolean(pendingToggle)}
        onClose={cancelToggleActive}
        onConfirm={confirmToggleActive}
        title={pendingToggle?.is_active ? 'Deactivate subscription?' : 'Activate subscription?'}
        message={
          pendingToggle?.is_active
            ? `${pendingToggle?.name} will be hidden from your active subscriptions. You can reactivate it anytime.`
            : `${pendingToggle?.name} will show up in your active subscriptions again.`
        }
        confirmLabel={pendingToggle?.is_active ? 'Deactivate' : 'Activate'}
        variant={pendingToggle?.is_active ? 'danger' : 'primary'}
        loading={togglingActive}
      />
    </div>
  )
}

export default SubscriptionsPage
