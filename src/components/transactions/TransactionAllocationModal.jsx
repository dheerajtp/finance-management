import Modal from '../ui/Modal'
import ConfirmModal from '../ui/ConfirmModal'
import Button from '../ui/Button'
import Skeleton from '../ui/Skeleton'
import ErrorState from '../ui/ErrorState'
import GoalTransactionAllocationForm from '../forms/goals/GoalTransactionAllocationForm'
import { formatCurrency } from '../../utils/finance/currency'
import useActionTransactionAllocation from '../../hooks/functionality/useActionTransactionAllocation'
import styles from './TransactionAllocationModal.module.css'

// Self-contained: owns its own data (via useActionTransactionAllocation)
// given just a transactionId, so TransactionsPage only needs to know
// whether the modal is open and for which transaction.
const TransactionAllocationModal = ({ transactionId, onClose }) => {
  const {
    transaction,
    currency,
    allocations,
    allocated,
    unallocated,
    isLoading,
    isError,
    isFormOpen,
    openForm,
    closeForm,
    register,
    errors,
    goalOptions,
    onSubmit,
    saving,
    pendingDelete,
    requestDelete,
    cancelDelete,
    confirmDelete,
    deleting,
  } = useActionTransactionAllocation(transactionId)

  return (
    <Modal isOpen={Boolean(transactionId)} onClose={onClose} title="Goal Allocations" icon="arrowLeftRight" size="sm">
      {isLoading && <Skeleton height="8rem" radius="var(--radius-lg)" />}

      {!isLoading && isError && <ErrorState message="We couldn't load this transaction's allocations." />}

      {!isLoading && !isError && transaction && (
        <div className={styles.wrap}>
          <div>
            <p className="text-card-title">{transaction.description || `${transaction.type} transaction`}</p>
            <p className="text-metric">{formatCurrency(transaction.amount, currency)}</p>
            <p className="text-caption">{transaction.transaction_date}</p>
          </div>

          <div className={styles.totals}>
            <span className="text-caption">Allocated: {formatCurrency(allocated, currency)}</span>
            <span className="text-caption">Unallocated: {formatCurrency(unallocated, currency)}</span>
          </div>

          {allocations.length > 0 && (
            <div className={styles.list}>
              {allocations.map((allocation) => (
                <div key={allocation.id} className={styles.row}>
                  <div>
                    <p className="text-body">{allocation.goalName}</p>
                    {allocation.note && <p className="text-caption">&ldquo;{allocation.note}&rdquo;</p>}
                  </div>
                  <div className={styles.rowTrailing}>
                    <p className="text-body">{formatCurrency(allocation.amount, allocation.currency)}</p>
                    <Button variant="ghost" className={styles.removeButton} onClick={() => requestDelete(allocation)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {unallocated > 0 &&
            (isFormOpen ? (
              <div className={styles.form}>
                <GoalTransactionAllocationForm
                  register={register}
                  onSubmit={onSubmit}
                  errors={errors}
                  saving={saving}
                  goalOptions={goalOptions}
                  isEditing={false}
                  submitLabel="Allocate to goal"
                />
                <Button variant="ghost" onClick={closeForm} disabled={saving}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={openForm}>
                Allocate to goal
              </Button>
            ))}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(pendingDelete)}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete this contribution?"
        message={
          pendingDelete
            ? `${formatCurrency(pendingDelete.amount, pendingDelete.currency)} allocated to ${pendingDelete.goalName}. This will remove the goal allocation but will NOT delete the original transaction.`
            : ''
        }
        confirmLabel="Delete contribution"
        variant="danger"
        loading={deleting}
      />
    </Modal>
  )
}

export default TransactionAllocationModal
