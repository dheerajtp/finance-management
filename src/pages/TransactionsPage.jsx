import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/ui/PageHeader'
import Skeleton from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import TransactionForm from '../components/forms/transactions/TransactionForm'
import TransactionCard from '../components/transactions/TransactionCard'
import TransactionTable from '../components/transactions/TransactionTable'
import TransactionSummary from '../components/transactions/TransactionSummary'
import TransactionFilters from '../components/transactions/TransactionFilters'
import TransactionAllocationModal from '../components/transactions/TransactionAllocationModal'
import useActionTransaction from '../hooks/functionality/useActionTransaction'
import styles from './TransactionsPage.module.css'

const TransactionsPage = () => {
  const {
    transactions,
    accountsById,
    categoriesById,
    isLoading,
    isError,
    refetch,
    typeFilter,
    setTypeFilter,
    accountFilter,
    setAccountFilter,
    accountFilterOptions,
    categoryFilter,
    setCategoryFilter,
    categoryFilterOptions,
    dateRangeFilter,
    setDateRangeFilter,
    search,
    setSearch,
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
    formCategoryOptions,
    onSubmit,
    saving,
    pendingDelete,
    requestDelete,
    cancelDelete,
    confirmDelete,
    deleting,
    allocatingTransactionId,
    requestAllocate,
    cancelAllocate,
  } = useActionTransaction()

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Where your money came from and where it went."
        actions={<Button onClick={openCreateForm}>
            <Icon name="plus" size="var(--icon-sm)" />
            Add Transaction
          </Button>}
      />

      <TransactionFilters
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        accountFilter={accountFilter}
        setAccountFilter={setAccountFilter}
        accountFilterOptions={accountFilterOptions}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        categoryFilterOptions={categoryFilterOptions}
        dateRangeFilter={dateRangeFilter}
        setDateRangeFilter={setDateRangeFilter}
        search={search}
        setSearch={setSearch}
      />

      {!isError && <TransactionSummary transactions={transactions} accountsById={accountsById} loading={isLoading} />}

      {isLoading && (
        <div className={styles.grid}>
          <Skeleton height="8rem" radius="var(--radius-lg)" />
          <Skeleton height="8rem" radius="var(--radius-lg)" />
          <Skeleton height="8rem" radius="var(--radius-lg)" />
        </div>
      )}

      {!isLoading && isError && <ErrorState message="We couldn't load your transactions." onRetry={refetch} />}

      {!isLoading && !isError && transactions.length === 0 && (
        <EmptyState
          icon="list"
          title="No transactions yet"
          description="Add your income and spending to start understanding where your money goes."
          action={<Button onClick={openCreateForm}>
            <Icon name="plus" size="var(--icon-sm)" />
            Add Transaction
          </Button>}
        />
      )}

      {!isLoading && !isError && transactions.length > 0 && (
        <>
          <div className={styles.desktopTable}>
            <TransactionTable
              transactions={transactions}
              accountsById={accountsById}
              categoriesById={categoriesById}
              onEdit={openEditForm}
              onDelete={requestDelete}
              onAllocate={requestAllocate}
            />
          </div>

          <div className={`${styles.grid} ${styles.mobileCards}`}>
            {transactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                accountsById={accountsById}
                categoriesById={categoriesById}
                onEdit={openEditForm}
                onDelete={requestDelete}
                onAllocate={requestAllocate}
              />
            ))}
          </div>
        </>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={isEditing ? 'Edit Transaction' : 'Add Transaction'}
        icon={isEditing ? 'pencil' : 'list'}
        size="sm"
      >
        <TransactionForm
          register={register}
          onSubmit={onSubmit}
          errors={errors}
          saving={saving}
          watchedType={watchedType}
          accountOptions={accountOptions}
          destinationAccountOptions={destinationAccountOptions}
          categoryOptions={formCategoryOptions}
          submitLabel={isEditing ? 'Save changes' : 'Add transaction'}
        />
      </Modal>

      <ConfirmModal
        isOpen={Boolean(pendingDelete)}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete this transaction?"
        message="Deleting this transaction will remove it from your financial history. This can't be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />

      <TransactionAllocationModal transactionId={allocatingTransactionId} onClose={cancelAllocate} />
    </div>
  )
}

export default TransactionsPage
