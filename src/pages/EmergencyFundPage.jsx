import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import Skeleton from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import EmergencyFundForm from '../components/forms/emergencyFund/EmergencyFundForm'
import EmergencyFundStatus from '../components/emergencyFund/EmergencyFundStatus'
import EssentialExpenseBaseline from '../components/emergencyFund/EssentialExpenseBaseline'
import EmergencyFundMilestone from '../components/emergencyFund/EmergencyFundMilestone'
import EmergencyFundCompletion from '../components/emergencyFund/EmergencyFundCompletion'
import TargetCalculationBreakdown from '../components/emergencyFund/TargetCalculationBreakdown'
import useActionEmergencyFund from '../hooks/functionality/useActionEmergencyFund'
import { DEFAULT_EMERGENCY_FUND_TARGET_MONTHS } from '../constants/emergencyFund'
import styles from './EmergencyFundPage.module.css'

const EmergencyFundPage = () => {
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
    accountOptions,
    hasEligibleAccounts,
    settings,
    accountIssue,
    baseline,
    target,
    current,
    progress,
    remaining,
    amountAboveTarget,
    contributionMonths,
    estimatedCompletionDate,
    nextMilestone,
    status,
  } = useActionEmergencyFund()

  if (!hasProfileCurrency && !isLoading) {
    return (
      <div className={styles.page}>
        <PageHeader title="Emergency Fund" />
        <EmptyState
          title="Complete your financial profile first"
          description="Your emergency fund is calculated in your profile currency."
          action={<Button onClick={() => navigate('/profile')}>Complete profile</Button>}
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <PageHeader title="Emergency Fund" />
        <div className={styles.skeletonGrid}>
          <Skeleton height="6rem" radius="var(--radius-lg)" />
          <Skeleton height="6rem" radius="var(--radius-lg)" />
          <Skeleton height="6rem" radius="var(--radius-lg)" />
        </div>
      </div>
    )
  }

  if (isError) {
    return <ErrorState message="We couldn't load your emergency fund." onRetry={refetch} />
  }

  const targetMonths = settings?.target_months ?? DEFAULT_EMERGENCY_FUND_TARGET_MONTHS

  return (
    <div className={styles.page}>
      <PageHeader
        title="Emergency Fund"
        description="A calm, goal-oriented buffer sized to your actual essential spending."
      />

      {accountIssue && <p className={`text-caption ${styles.notice}`}>{accountIssue}</p>}

      <EmergencyFundStatus
        target={target}
        current={current}
        remaining={remaining}
        amountAboveTarget={amountAboveTarget}
        progress={progress}
        status={status}
        currency={currency}
        targetMonths={targetMonths}
      />

      <div className={styles.gridSecondary}>
        <Card>
          <p className="text-section-title">Target Configuration</p>
          <EmergencyFundForm
            register={register}
            onSubmit={onSubmit}
            errors={errors}
            saving={saving}
            accountOptions={accountOptions}
            hasEligibleAccounts={hasEligibleAccounts}
          />
        </Card>
        <Card>
          <EssentialExpenseBaseline baseline={baseline} currency={currency} />
        </Card>
      </div>

      <div className={styles.grid}>
        <Card>
          <EmergencyFundMilestone
            progress={progress}
            current={current}
            target={target}
            nextMilestone={nextMilestone}
            currency={currency}
            status={status}
          />
        </Card>

        <Card>
          <EmergencyFundCompletion
            contributionMonths={contributionMonths}
            estimatedCompletionDate={estimatedCompletionDate}
            monthlyContribution={settings?.monthly_contribution}
            currency={currency}
          />
        </Card>
      </div>

      <Card>
        <TargetCalculationBreakdown baseline={baseline} targetMonths={targetMonths} target={target} currency={currency} status={status} />
      </Card>
    </div>
  )
}

export default EmergencyFundPage
