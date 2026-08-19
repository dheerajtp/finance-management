import PageHeader from '../components/ui/PageHeader'
import Skeleton from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import Modal from '../components/ui/Modal'
import SafeToSpendSummary from '../components/safeToSpend/SafeToSpendSummary'
import CommitmentBreakdown from '../components/safeToSpend/CommitmentBreakdown'
import FlexibleAllocation from '../components/safeToSpend/FlexibleAllocation'
import AllocationForm from '../components/forms/spendingPlan/AllocationForm'
import useActionSpendingPlan from '../hooks/functionality/useActionSpendingPlan'
import styles from './SafeToSpendPage.module.css'

const SafeToSpendPage = () => {
  const {
    isLoading,
    isError,
    refetch,
    currency,
    monthLabel,
    hasIncome,
    income,
    essentialExpenses,
    commitments,
    committedAmount,
    availableAmount,
    overCommittedAmount,
    isOverCommitted,
    categories,
    unallocatedSpending,
    unallocatedAmount,
    unallocatedPercentage,
    hasFlexibleSpending,
    hasOtherCurrencyActivity,
    budgetTotalByFlexibleGroup,
    showAllocationForm,
    openAllocationForm,
    closeAllocationForm,
    register,
    errors,
    watchedTotalPercentage,
    onSubmit,
    saving,
  } = useActionSpendingPlan()

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Safe to Spend" description="What's left for flexible spending this month, after your plans." />
        <Skeleton height="16rem" radius="var(--radius-lg)" />
        <div className={styles.section}>
          <Skeleton height="12rem" radius="var(--radius-lg)" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Safe to Spend" />
        <ErrorState message="Safe-to-spend information is temporarily unavailable." onRetry={refetch} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Safe to Spend" description="What's left for flexible spending this month, after your plans." />

      {hasOtherCurrencyActivity && (
        <p className={`text-caption ${styles.notice}`}>
          Some transactions or commitments use other currencies and aren&rsquo;t included in this calculation.
        </p>
      )}

      <SafeToSpendSummary
        monthLabel={monthLabel}
        currency={currency}
        hasIncome={hasIncome}
        isOverCommitted={isOverCommitted}
        availableAmount={availableAmount}
        overCommittedAmount={overCommittedAmount}
        income={income}
        essentialExpenses={essentialExpenses}
        committedAmount={committedAmount}
      />

      <div className={styles.section}>
        <CommitmentBreakdown commitments={commitments} essentialExpenses={essentialExpenses} currency={currency} />
      </div>

      {hasIncome && (
        <div className={styles.section}>
          <FlexibleAllocation
            categories={categories}
            currency={currency}
            unallocatedSpending={unallocatedSpending}
            unallocatedAmount={unallocatedAmount}
            unallocatedPercentage={unallocatedPercentage}
            hasFlexibleSpending={hasFlexibleSpending}
            budgetTotalByFlexibleGroup={budgetTotalByFlexibleGroup}
            onEditAllocation={openAllocationForm}
          />
        </div>
      )}

      <Modal isOpen={showAllocationForm} onClose={closeAllocationForm} title="Edit Allocation" icon="sliders" size="sm">
        <AllocationForm
          register={register}
          onSubmit={onSubmit}
          errors={errors}
          saving={saving}
          totalPercentage={watchedTotalPercentage}
        />
      </Modal>
    </div>
  )
}

export default SafeToSpendPage
