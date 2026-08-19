import { useState } from 'react'
import toast from 'react-hot-toast'
import { useMarkRecurringTransactionProcessedMutation } from '../api/useRecurringTransactionApi'
import { useCreateTransactionMutation } from '../api/useTransactionApi'
import { calculateNextOccurrence } from '../../utils/finance/recurringTransactions'

// The created transaction goes through the existing transaction service, so
// it can raise the same messages validate_transaction() (0005 migration) is
// known to raise — e.g. an account deactivated after this recurring
// transaction was created.
const KNOWN_MESSAGES = [
  'Account not found',
  'Destination account not found',
  'Category not found',
  'Category type does not match transaction type',
  'Cannot transfer between accounts with different currencies',
]

const toFriendlyMessage = (error) => {
  if (KNOWN_MESSAGES.some((message) => error?.message?.includes(message))) return error.message
  return 'Could not record this transaction. Please try again.'
}

// Confirming ONE due/overdue occurrence: creates exactly one row in the
// existing transactions table (via the existing transaction service/
// validation — never a second write path) and advances
// next_occurrence_date by one period. Never touches accounts.balance, and
// never creates more than the one occurrence the user explicitly confirmed
// — catching up several missed months means clicking this several times.
const useActionRecurringTransactionRecord = () => {
  const createTransactionMutation = useCreateTransactionMutation()
  const markProcessedMutation = useMarkRecurringTransactionProcessedMutation()

  const [pendingRecord, setPendingRecord] = useState(null)
  const [recordingId, setRecordingId] = useState(null)

  const requestRecord = (item) => setPendingRecord(item)
  const cancelRecord = () => setPendingRecord(null)

  // recordingId is set synchronously on click, before any mutation or
  // re-render — a fast double-click on the same item is rejected here, not
  // just by the (slightly later) disabled-button state.
  const confirmRecord = async () => {
    if (!pendingRecord || recordingId === pendingRecord.id) return
    setRecordingId(pendingRecord.id)

    try {
      const transaction = await createTransactionMutation.mutateAsync({
        type: pendingRecord.type,
        account_id: pendingRecord.account_id,
        amount: pendingRecord.amount,
        description: pendingRecord.description,
        transaction_date: pendingRecord.next_occurrence_date,
        category_id: pendingRecord.type === 'transfer' ? null : pendingRecord.category_id,
        destination_account_id: pendingRecord.type === 'transfer' ? pendingRecord.destination_account_id : null,
      })

      await markProcessedMutation.mutateAsync({
        id: pendingRecord.id,
        transactionId: transaction.id,
        nextOccurrenceDate: calculateNextOccurrence(
          pendingRecord.next_occurrence_date,
          pendingRecord.frequency,
          pendingRecord.start_date,
        ),
      })

      toast.success('Transaction recorded')
      setPendingRecord(null)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    } finally {
      setRecordingId(null)
    }
  }

  return {
    pendingRecord,
    requestRecord,
    cancelRecord,
    confirmRecord,
    recording: createTransactionMutation.isPending || markProcessedMutation.isPending,
  }
}

export default useActionRecurringTransactionRecord
