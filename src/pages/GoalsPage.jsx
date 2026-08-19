import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import Select from '../components/ui/Select'
import Skeleton from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import GoalForm from '../components/forms/goals/GoalForm'
import GoalCard from '../components/goals/GoalCard'
import GoalSummary from '../components/goals/GoalSummary'
import useActionGoal from '../hooks/functionality/useActionGoal'
import { formatCurrency } from '../utils/finance/currency'
import styles from './GoalsPage.module.css'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'on_track', label: 'On track' },
  { value: 'behind', label: 'Behind' },
  { value: 'target_reached', label: 'Reached' },
]

const PRIORITY_FILTER_OPTIONS = [
  { value: 'all', label: 'All priorities' },
  { value: '1', label: 'High' },
  { value: '2', label: 'Medium' },
  { value: '3', label: 'Low' },
]

const GoalsPage = () => {
  const navigate = useNavigate()
  const {
    goals,
    summary,
    recentContributions,
    isLoading,
    isError,
    refetch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
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
    pendingToggle,
    requestToggleActive,
    cancelToggleActive,
    confirmToggleActive,
    togglingActive,
  } = useActionGoal()

  return (
    <div>
      <PageHeader
        title="Goals"
        description="What you're saving for, and how you're tracking."
        actions={<Button onClick={openCreateForm}>
            <Icon name="plus" size="var(--icon-sm)" />
            Add Goal
          </Button>}
      />

      <GoalSummary summary={summary} loading={isLoading} />

      {!isLoading && !isError && recentContributions.length > 0 && (
        <Card className={styles.recentContributions}>
          <p className="text-section-title">Recent contributions</p>
          <div className={styles.recentList}>
            {recentContributions.map((contribution) => (
              <button
                key={contribution.id}
                type="button"
                className={styles.recentRow}
                onClick={() => navigate(`/goals/${contribution.goal_id}`)}
              >
                <div>
                  <p className="text-body">{contribution.goalName}</p>
                  <p className="text-caption">{contribution.contribution_date}</p>
                </div>
                <p className="text-body">+{formatCurrency(contribution.amount, contribution.currency)}</p>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className={styles.filters}>
        <Select
          id="goal-status-filter"
          label="Status"
          options={STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        />
        <Select
          id="goal-priority-filter"
          label="Priority"
          options={PRIORITY_FILTER_OPTIONS}
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
        />
        <label className={styles.toggle}>
          <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />
          Show inactive goals
        </label>
      </div>

      {isLoading && (
        <div className={styles.grid}>
          <Skeleton height="14rem" radius="var(--radius-lg)" />
          <Skeleton height="14rem" radius="var(--radius-lg)" />
        </div>
      )}

      {!isLoading && isError && <ErrorState message="We couldn't load your goals." onRetry={refetch} />}

      {!isLoading && !isError && goals.length === 0 && (
        <EmptyState
          icon="flag"
          title="Create your first financial goal."
          description="Build an emergency fund, save for a vacation, buy a car, or build an investment corpus."
          action={<Button onClick={openCreateForm}>
            <Icon name="plus" size="var(--icon-sm)" />
            Add Goal
          </Button>}
        />
      )}

      {!isLoading && !isError && goals.length > 0 && (
        <div className={styles.grid}>
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onEdit={openEditForm} onToggleActive={requestToggleActive} />
          ))}
        </div>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={isEditing ? 'Edit Goal' : 'Add Goal'}
        icon={isEditing ? 'pencil' : 'flag'}
        size="sm"
      >
        <GoalForm
          register={register}
          onSubmit={onSubmit}
          errors={errors}
          saving={saving}
          submitLabel={isEditing ? 'Save changes' : 'Add goal'}
        />
      </Modal>

      <ConfirmModal
        isOpen={Boolean(pendingToggle)}
        onClose={cancelToggleActive}
        onConfirm={confirmToggleActive}
        title={pendingToggle?.is_active ? 'Deactivate goal?' : 'Activate goal?'}
        message={
          pendingToggle?.is_active
            ? `${pendingToggle?.name} will be hidden from your active goals. You can reactivate it anytime.`
            : `${pendingToggle?.name} will show up in your active goals again.`
        }
        confirmLabel={pendingToggle?.is_active ? 'Deactivate' : 'Activate'}
        variant={pendingToggle?.is_active ? 'danger' : 'primary'}
        loading={togglingActive}
      />
    </div>
  )
}

export default GoalsPage
