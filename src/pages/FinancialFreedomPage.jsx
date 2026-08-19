import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import Skeleton from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import FinancialFreedomSettingsForm from '../components/forms/financialFreedom/FinancialFreedomSettingsForm'
import FIProgress from '../components/financialFreedom/FIProgress'
import FITargetBreakdown from '../components/financialFreedom/FITargetBreakdown'
import FIScenarios from '../components/financialFreedom/FIScenarios'
import DiscretionaryReductionScenario from '../components/financialFreedom/DiscretionaryReductionScenario'
import FIAssumptions from '../components/financialFreedom/FIAssumptions'
import FinancialFreedomInsight from '../components/financialFreedom/FinancialFreedomInsight'
import useActionFinancialFreedom from '../hooks/functionality/useActionFinancialFreedom'
import styles from './FinancialFreedomPage.module.css'

const FinancialFreedomPage = () => {
  const navigate = useNavigate()
  const {
    hasProfileCurrency,
    currency,
    isLoading,
    isError,
    refetch,
    register,
    onSubmit,
    errors,
    saving,
    eligibleAccounts,
    selectedAccountIds,
    toggleAccount,
    analysisMonths,
    fiMultiplier,
    expectedAnnualReturn,
    monthlyContribution,
    spending,
    estimatedAnnualSpending,
    fiTarget,
    currentFIAssets,
    fiProgress,
    fiGap,
    projection,
    scenarios,
    discretionaryScenarios,
    insights,
    hasSufficientHistory,
    hasSelectedAccounts,
    hasOtherCurrencyAccountsSelected,
    hasOtherCurrencyTransactions,
  } = useActionFinancialFreedom()

  if (!hasProfileCurrency && !isLoading) {
    return (
      <div>
        <PageHeader title="Financial Freedom" />
        <EmptyState
          title="Complete your financial profile first"
          description="The Financial Freedom calculator operates in your profile currency."
          action={<Button onClick={() => navigate('/profile')}>Complete profile</Button>}
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Financial Freedom" />
        <div className={styles.skeletonGrid}>
          <Skeleton height="6rem" radius="var(--radius-lg)" />
          <Skeleton height="6rem" radius="var(--radius-lg)" />
          <Skeleton height="6rem" radius="var(--radius-lg)" />
        </div>
      </div>
    )
  }

  if (isError) {
    return <ErrorState message="We couldn't load your financial freedom calculator." onRetry={refetch} />
  }

  return (
    <div>
      <PageHeader
        title="Financial Freedom"
        description="An educational estimate based on your assumptions — not a guarantee."
      />

      {!hasSufficientHistory && (
        <EmptyState
          icon="barChart"
          title="Not enough financial history yet"
          description="The Financial Freedom estimate becomes more useful once you have completed-month income and expense data."
        />
      )}

      {hasSufficientHistory && !hasSelectedAccounts && (
        <p className={`text-caption ${styles.notice}`}>
          Select accounts that should count toward your financial independence assets in the settings below.
        </p>
      )}

      {hasOtherCurrencyAccountsSelected && (
        <p className={`text-caption ${styles.notice}`}>
          Some selected accounts use another currency and are excluded from this calculation.
        </p>
      )}

      {hasOtherCurrencyTransactions && (
        <p className={`text-caption ${styles.notice}`}>
          Some transactions use other currencies and aren&rsquo;t included in these totals.
        </p>
      )}

      <FIProgress
        currentFIAssets={currentFIAssets}
        fiTarget={fiTarget}
        fiGap={fiGap}
        fiProgress={fiProgress}
        currency={currency}
      />

      <Card className={styles.section}>
        <p className="text-section-title">Financial Freedom Settings</p>
        <FinancialFreedomSettingsForm
          register={register}
          onSubmit={onSubmit}
          errors={errors}
          saving={saving}
          eligibleAccounts={eligibleAccounts}
          selectedAccountIds={selectedAccountIds}
          onToggleAccount={toggleAccount}
        />
      </Card>

      <Card className={styles.section}>
        <FITargetBreakdown
          spending={spending}
          estimatedAnnualSpending={estimatedAnnualSpending}
          fiMultiplier={fiMultiplier}
          fiTarget={fiTarget}
          currency={currency}
        />
      </Card>

      <Card className={styles.section}>
        <p className="text-section-title">Projection</p>
        {projection ? (
          <p className="text-secondary">
            Estimated timeline: approximately {projection.years.toFixed(1)} years, based on your current assumptions.
            Estimated target date: {projection.estimatedTargetDate}.
          </p>
        ) : (
          <p className="text-secondary">
            At the current contribution level, the target cannot be reached under this model without investment
            growth, or the target is not reached within the 100-year projection horizon.
          </p>
        )}
      </Card>

      <Card className={styles.section}>
        <FIScenarios scenarios={scenarios} currency={currency} />
      </Card>

      <Card className={styles.section}>
        <DiscretionaryReductionScenario discretionaryScenarios={discretionaryScenarios} currency={currency} />
      </Card>

      <div className={styles.grid}>
        <Card variant="flat">
          <FIAssumptions
            analysisMonths={analysisMonths}
            fiMultiplier={fiMultiplier}
            expectedAnnualReturn={expectedAnnualReturn}
            monthlyContribution={monthlyContribution}
            selectedAccountsCount={selectedAccountIds.length}
            currency={currency}
          />
        </Card>
        <FinancialFreedomInsight insights={insights} />
      </div>
    </div>
  )
}

export default FinancialFreedomPage
