import { useParams, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import Skeleton from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import GoalCard from '../components/goals/GoalCard'
import GoalContributionForm from '../components/forms/goals/GoalContributionForm'
import GoalContributionHistory from '../components/goals/GoalContributionHistory'
import GoalTransactionAllocationForm from '../components/forms/goals/GoalTransactionAllocationForm'
import GoalContributionSummary from '../components/goals/GoalContributionSummary'
import GoalContributionList from '../components/goals/GoalContributionList'
import useActionGoalContribution from '../hooks/functionality/useActionGoalContribution'
import useActionGoalTransactionAllocation from '../hooks/functionality/useActionGoalTransactionAllocation'
import { formatCurrency } from '../utils/finance/currency'
import styles from './GoalDetailPage.module.css'

const GoalDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const {
    goal,
    goalLoading,
    goalError,
    refetchGoal,
    contributions,
    contributionsLoading,
    contributionsError,
    refetchContributions,
    isFormOpen,
    isEditing,
    openAddForm,
    openEditForm,
    closeForm,
    register,
    errors,
    onSubmit,
    saving,
    pendingDelete,
    requestDelete,
    cancelDelete,
    confirmDelete,
    deleting,
  } = useActionGoalContribution(id)

  const {
    allocations,
    allocationsLoading,
    allocationsError,
    summary: allocationSummary,
    isFormOpen: isAllocationFormOpen,
    isEditing: isEditingAllocation,
    openAddForm: openAllocationForm,
    openEditForm: openEditAllocationForm,
    closeForm: closeAllocationForm,
    register: registerAllocation,
    errors: allocationErrors,
    transactionOptions,
    onSubmit: onSubmitAllocation,
    saving: savingAllocation,
    pendingDelete: pendingDeleteAllocation,
    requestDelete: requestDeleteAllocation,
    cancelDelete: cancelDeleteAllocation,
    confirmDelete: confirmDeleteAllocation,
    deleting: deletingAllocation,
  } = useActionGoalTransactionAllocation(goal)

  const isLoading = goalLoading || contributionsLoading
  const isError = goalError || contributionsError

  return (
    <div>
      <PageHeader
        title={goal?.name ?? 'Goal'}
        description="Contribution history and progress for this goal."
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate('/goals')}>
              Back to goals
            </Button>
            <Button onClick={openAddForm}>
              <Icon name="plus" size="var(--icon-sm)" />
              Add contribution
            </Button>
          </>
        }
      />

      {isLoading && (
        <div className={styles.stack}>
          <Skeleton height="14rem" radius="var(--radius-lg)" />
          <Skeleton height="10rem" radius="var(--radius-lg)" />
        </div>
      )}

      {!isLoading && isError && (
        <ErrorState
          message="We couldn't load this goal."
          onRetry={() => {
            refetchGoal()
            refetchContributions()
          }}
        />
      )}

      {!isLoading && !isError && !goal && (
        <EmptyState icon="flag" title="Goal not found" description="This goal may have been removed." />
      )}

      {!isLoading && !isError && goal && (
        <>
          <GoalCard goal={goal} showNavActions={false} />

          <div className={styles.summary}>
            <StatCard label="Total contributed" value={formatCurrency(goal.current_amount, goal.currency)} />
            <StatCard label="Remaining" value={formatCurrency(goal.remaining, goal.currency)} />
            <StatCard label="Progress" value={`${goal.progress.toFixed(0)}%`} />
            <StatCard label="Contributions logged" value={String(contributions.length + allocations.length)} />
          </div>

          <div className={styles.historySection}>
            <p className="text-section-title">Contribution history</p>
            <p className="text-caption">Amounts you&rsquo;ve logged directly toward this goal.</p>
            {contributions.length === 0 ? (
              <EmptyState
                icon="piggyBank"
                title="No contributions yet"
                description="Log your first contribution toward this goal."
                action={<Button onClick={openAddForm}>Add contribution</Button>}
              />
            ) : (
              <GoalContributionHistory contributions={contributions} onEdit={openEditForm} onDelete={requestDelete} />
            )}
          </div>

          <div className={styles.historySection}>
            <div className={styles.sectionHeader}>
              <div>
                <p className="text-section-title">Transaction allocations</p>
                <p className="text-caption">Parts of your real income/expense transactions earmarked for this goal.</p>
              </div>
              <Button variant="secondary" onClick={openAllocationForm}>
                <Icon name="plus" size="var(--icon-sm)" />
                Allocate a transaction
              </Button>
            </div>

            {!allocationsLoading && allocationsError && (
              <ErrorState message="We couldn't load transaction allocations." />
            )}

            {!allocationsLoading && !allocationsError && (
              <>
                {allocations.length > 0 && (
                  <GoalContributionSummary
                    summary={allocationSummary}
                    currency={goal.currency}
                    showGoalProgress={false}
                    totalLabel="Total from transactions"
                  />
                )}
                {allocations.length === 0 ? (
                  <EmptyState
                    icon="arrowLeftRight"
                    title="No transactions allocated yet"
                    description="Earmark part of a real income transaction — like your salary — toward this goal."
                    action={<Button onClick={openAllocationForm}>Allocate a transaction</Button>}
                  />
                ) : (
                  <GoalContributionList allocations={allocations} onEdit={openEditAllocationForm} onDelete={requestDeleteAllocation} />
                )}
              </>
            )}
          </div>
        </>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={isEditing ? 'Edit Contribution' : 'Add Contribution'}
        icon={isEditing ? 'pencil' : 'piggyBank'}
        size="sm"
      >
        <GoalContributionForm
          register={register}
          onSubmit={onSubmit}
          errors={errors}
          saving={saving}
          submitLabel={isEditing ? 'Save changes' : 'Add contribution'}
        />
      </Modal>

      <ConfirmModal
        isOpen={Boolean(pendingDelete)}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete this contribution?"
        message="Deleting this contribution will reduce this goal's contributed total. This can't be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />

      <Modal
        isOpen={isAllocationFormOpen}
        onClose={closeAllocationForm}
        title={isEditingAllocation ? 'Edit Allocation' : 'Allocate a Transaction'}
        icon={isEditingAllocation ? 'pencil' : 'arrowLeftRight'}
        size="sm"
      >
        <GoalTransactionAllocationForm
          register={registerAllocation}
          onSubmit={onSubmitAllocation}
          errors={allocationErrors}
          saving={savingAllocation}
          transactionOptions={transactionOptions}
          isEditing={isEditingAllocation}
          submitLabel={isEditingAllocation ? 'Save changes' : 'Allocate to this goal'}
        />
      </Modal>

      <ConfirmModal
        isOpen={Boolean(pendingDeleteAllocation)}
        onClose={cancelDeleteAllocation}
        onConfirm={confirmDeleteAllocation}
        title="Delete this contribution?"
        message={
          pendingDeleteAllocation
            ? `${formatCurrency(pendingDeleteAllocation.amount, pendingDeleteAllocation.currency)} allocated to ${goal?.name ?? 'this goal'}. This will remove the goal allocation but will NOT delete the original transaction.`
            : ''
        }
        confirmLabel="Delete contribution"
        variant="danger"
        loading={deletingAllocation}
      />
    </div>
  )
}

export default GoalDetailPage
