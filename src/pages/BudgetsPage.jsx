import { format } from 'date-fns'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/ui/PageHeader'
import Select from '../components/ui/Select'
import Skeleton from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import BudgetForm from '../components/forms/budgets/BudgetForm'
import BudgetCard from '../components/budgets/BudgetCard'
import BudgetSummary from '../components/budgets/BudgetSummary'
import useActionBudget from '../hooks/functionality/useActionBudget'
import { formatCurrency } from '../utils/finance/currency'
import styles from './BudgetsPage.module.css'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'on_track', label: 'On track' },
  { value: 'attention', label: 'Attention' },
  { value: 'near_limit', label: 'Near limit' },
  { value: 'over_budget', label: 'Over budget' },
]

const CLASSIFICATION_FILTER_OPTIONS = [
  { value: 'all', label: 'All classifications' },
  { value: 'essential', label: 'Essential' },
  { value: 'discretionary', label: 'Discretionary' },
]

const BudgetsPage = () => {
  const {
    budgets,
    allBudgets,
    summary,
    uncategorizedSummary,
    isLoading,
    isError,
    refetch,
    statusFilter,
    setStatusFilter,
    classificationFilter,
    setClassificationFilter,
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
    categoryOptions,
    suggestion,
    suggestionCurrency,
    useSuggestion,
    pendingToggle,
    requestToggleActive,
    cancelToggleActive,
    confirmToggleActive,
    togglingActive,
  } = useActionBudget()

  return (
    <div>
      <PageHeader
        title="Budgets"
        description="Spending limits you set, category by category."
        actions={<Button onClick={openCreateForm}>
            <Icon name="plus" size="var(--icon-sm)" />
            Add Budget
          </Button>}
      />

      <BudgetSummary summary={summary} loading={isLoading} />

      <p className={`text-label ${styles.monthIndicator}`}>{format(new Date(), 'MMMM yyyy')}</p>

      <div className={styles.filters}>
        <Select
          id="budget-status-filter"
          label="Status"
          options={STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        />
        <Select
          id="budget-classification-filter"
          label="Classification"
          options={CLASSIFICATION_FILTER_OPTIONS}
          value={classificationFilter}
          onChange={(event) => setClassificationFilter(event.target.value)}
        />
        <label className={styles.toggle}>
          <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />
          Show inactive budgets
        </label>
      </div>

      {isLoading && (
        <div className={styles.grid}>
          <Skeleton height="10rem" radius="var(--radius-lg)" />
          <Skeleton height="10rem" radius="var(--radius-lg)" />
        </div>
      )}

      {!isLoading && isError && <ErrorState message="We couldn't load your budgets." onRetry={refetch} />}

      {!isLoading && !isError && allBudgets.length === 0 && (
        <EmptyState
          icon="target"
          title="Set your first spending limit."
          description="Budgets help you decide how much you're comfortable spending in each category."
          action={<Button onClick={openCreateForm}>
            <Icon name="plus" size="var(--icon-sm)" />
            Add Budget
          </Button>}
        />
      )}

      {!isLoading && !isError && allBudgets.length > 0 && (
        <div className={styles.grid}>
          {budgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} onEdit={openEditForm} onToggleActive={requestToggleActive} />
          ))}
        </div>
      )}

      {!isLoading && !isError && uncategorizedSummary.length > 0 && (
        <div className={styles.notice}>
          {uncategorizedSummary.map((group) => (
            <p key={group.currency} className="text-caption">
              You have {formatCurrency(group.amount, group.currency)} of uncategorized spending that isn&rsquo;t included in
              category budgets.
            </p>
          ))}
        </div>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={isEditing ? 'Edit Budget' : 'Add Budget'}
        icon={isEditing ? 'pencil' : 'target'}
        size="sm"
      >
        <BudgetForm
          register={register}
          onSubmit={onSubmit}
          errors={errors}
          saving={saving}
          categoryOptions={categoryOptions}
          suggestion={suggestion}
          suggestionCurrency={suggestionCurrency}
          onUseSuggestion={useSuggestion}
          submitLabel={isEditing ? 'Save changes' : 'Add budget'}
        />
      </Modal>

      <ConfirmModal
        isOpen={Boolean(pendingToggle)}
        onClose={cancelToggleActive}
        onConfirm={confirmToggleActive}
        title={pendingToggle?.is_active ? 'Deactivate budget?' : 'Activate budget?'}
        message={
          pendingToggle?.is_active
            ? `${pendingToggle?.categoryName ?? 'This budget'} will be hidden from your active budgets. You can reactivate it anytime.`
            : `${pendingToggle?.categoryName ?? 'This budget'} will show up in your active budgets again.`
        }
        confirmLabel={pendingToggle?.is_active ? 'Deactivate' : 'Activate'}
        variant={pendingToggle?.is_active ? 'danger' : 'primary'}
        loading={togglingActive}
      />
    </div>
  )
}

export default BudgetsPage
