import { format, parseISO } from 'date-fns'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/ui/PageHeader'
import Select from '../components/ui/Select'
import Skeleton from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import RecurringTransactionForm from '../components/forms/recurringTransactions/RecurringTransactionForm'
import RecurringTransactionCard from '../components/recurringTransactions/RecurringTransactionCard'
import RecurringTransactionSummary from '../components/recurringTransactions/RecurringTransactionSummary'
import UpcomingRecurringTransactions from '../components/recurringTransactions/UpcomingRecurringTransactions'
import useActionRecurringTransaction from '../hooks/functionality/useActionRecurringTransaction'
import useActionRecurringTransactionForm from '../hooks/functionality/useActionRecurringTransactionForm'
import useActionRecurringTransactionRecord from '../hooks/functionality/useActionRecurringTransactionRecord'
import { TRANSACTION_TYPES } from '../constants/transactionTypes'
import { RECURRING_FREQUENCIES } from '../constants/recurringFrequency'
import { formatCurrency } from '../utils/finance/currency'
import styles from './RecurringTransactionsPage.module.css'

const TYPE_FILTER_OPTIONS = [{ value: 'all', label: 'All types' }, ...TRANSACTION_TYPES]
const FREQUENCY_FILTER_OPTIONS = [{ value: 'all', label: 'All frequencies' }, ...RECURRING_FREQUENCIES]
const EXAMPLES = ['Salary', 'Rent', 'Insurance', 'Subscriptions', 'Investments']

const RecurringTransactionsPage = () => {
  const {
    recurringTransactions,
    allRecurringTransactions,
    upcomingRecurringTransactions,
    summary,
    isLoading,
    isError,
    refetch,
    typeFilter,
    setTypeFilter,
    frequencyFilter,
    setFrequencyFilter,
    showInactive,
    setShowInactive,
    pendingToggle,
    requestToggleActive,
    cancelToggleActive,
    confirmToggleActive,
    togglingActive,
  } = useActionRecurringTransaction()

  const {
    isFormOpen,
    isEditing,
    openCreateForm,
    openEditForm,
    closeForm,
    register,
    errors,
    watchedType,
    accountOptions,
    destinationAccountOptions,
    categoryOptions,
    subscriptionOptions,
    applySubscription,
    onSubmit,
    saving,
  } = useActionRecurringTransactionForm()

  const { pendingRecord, requestRecord, cancelRecord, confirmRecord, recording } = useActionRecurringTransactionRecord()

  return (
    <div className={styles.page}>
      <PageHeader
        title="Recurring Transactions"
        description="Expected income, expenses, and transfers — nothing posts until you confirm it."
        actions={<Button onClick={openCreateForm}>
            <Icon name="plus" size="var(--icon-sm)" />
            Add Recurring Transaction
          </Button>}
      />

      <RecurringTransactionSummary summary={summary} loading={isLoading} />

      {!isLoading && !isError && <UpcomingRecurringTransactions items={upcomingRecurringTransactions} />}

      <div className={styles.filters}>
        <Select
          id="recurring-type-filter"
          label="Type"
          options={TYPE_FILTER_OPTIONS}
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        />
        <Select
          id="recurring-frequency-filter"
          label="Frequency"
          options={FREQUENCY_FILTER_OPTIONS}
          value={frequencyFilter}
          onChange={(event) => setFrequencyFilter(event.target.value)}
        />
        <label className={styles.toggle}>
          <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />
          Show inactive
        </label>
      </div>

      {isLoading && (
        <div className={styles.grid}>
          <Skeleton height="14rem" radius="var(--radius-lg)" />
          <Skeleton height="14rem" radius="var(--radius-lg)" />
        </div>
      )}

      {!isLoading && isError && <ErrorState message="We couldn't load your recurring transactions." onRetry={refetch} />}

      {!isLoading && !isError && allRecurringTransactions.length === 0 && (
        <EmptyState
          icon="refresh"
          title="No recurring transactions yet"
          description="Track recurring income, expenses, and transfers so you can see what is coming up."
          action={
            <div className={styles.emptyActions}>
              <Button onClick={openCreateForm}>
                <Icon name="plus" size="var(--icon-sm)" />
                Add recurring transaction
              </Button>
              <p className="text-caption">
                Examples: {EXAMPLES.join(', ')} — these are only examples, nothing is created until you add one.
              </p>
            </div>
          }
        />
      )}

      {!isLoading && !isError && allRecurringTransactions.length > 0 && (
        <div className={styles.grid}>
          {recurringTransactions.map((item) => (
            <RecurringTransactionCard
              key={item.id}
              item={item}
              onEdit={openEditForm}
              onToggleActive={requestToggleActive}
              onRecord={requestRecord}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={isEditing ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}
        icon={isEditing ? 'pencil' : 'refresh'}
        size="sm"
      >
        <RecurringTransactionForm
          register={register}
          onSubmit={onSubmit}
          errors={errors}
          saving={saving}
          watchedType={watchedType}
          accountOptions={accountOptions}
          destinationAccountOptions={destinationAccountOptions}
          categoryOptions={categoryOptions}
          subscriptionOptions={subscriptionOptions}
          onApplySubscription={applySubscription}
          submitLabel={isEditing ? 'Save changes' : 'Add recurring transaction'}
        />
      </Modal>

      <ConfirmModal
        isOpen={Boolean(pendingToggle)}
        onClose={cancelToggleActive}
        onConfirm={confirmToggleActive}
        title={pendingToggle?.is_active ? 'Deactivate recurring transaction?' : 'Activate recurring transaction?'}
        message={
          pendingToggle?.is_active
            ? `${pendingToggle?.description || 'This recurring transaction'} will be hidden from your active items. You can reactivate it anytime.`
            : `${pendingToggle?.description || 'This recurring transaction'} will show up as active again.`
        }
        confirmLabel={pendingToggle?.is_active ? 'Deactivate' : 'Activate'}
        variant={pendingToggle?.is_active ? 'danger' : 'primary'}
        loading={togglingActive}
      />

      <ConfirmModal
        isOpen={Boolean(pendingRecord)}
        onClose={cancelRecord}
        onConfirm={confirmRecord}
        title="Record recurring transaction?"
        message={
          pendingRecord && (
            <span className={styles.recordSummary}>
              <span className="text-card-title">{pendingRecord.description || `Recurring ${pendingRecord.type}`}</span>
              <span className="text-metric">{formatCurrency(pendingRecord.amount, pendingRecord.currency)}</span>
              <span className="text-secondary">
                Date: {format(parseISO(pendingRecord.next_occurrence_date), 'MMMM d, yyyy')}
              </span>
              {pendingRecord.type === 'transfer' ? (
                <span className="text-secondary">
                  From {pendingRecord.accountName} to {pendingRecord.destinationAccountName}
                </span>
              ) : (
                <>
                  <span className="text-secondary">Account: {pendingRecord.accountName}</span>
                  <span className="text-secondary">Category: {pendingRecord.categoryName ?? 'None'}</span>
                </>
              )}
              <span className="text-caption">This will create an actual transaction in your transaction history.</span>
            </span>
          )
        }
        confirmLabel="Record transaction"
        variant="primary"
        loading={recording}
      />
    </div>
  )
}

export default RecurringTransactionsPage
