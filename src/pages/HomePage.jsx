import { useNavigate } from 'react-router-dom'
import useActionDashboard from '../hooks/functionality/useActionDashboard'
import useActionDashboardPlanning from '../hooks/functionality/useActionDashboardPlanning'
import useActionDashboardCommitments from '../hooks/functionality/useActionDashboardCommitments'
import useActionFinancialHealth from '../hooks/functionality/useActionFinancialHealth'
import useActionSpendingPlan from '../hooks/functionality/useActionSpendingPlan'
import ErrorState from '../components/ui/ErrorState'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import Select from '../components/ui/Select'
import Skeleton from '../components/ui/Skeleton'
import PageHeader from '../components/ui/PageHeader'
import Section from '../components/ui/Section'
import SavingsTarget from '../components/dashboard/SavingsTarget'
import AccountPosition from '../components/dashboard/AccountPosition'
import SpendingBreakdown from '../components/dashboard/SpendingBreakdown'
import TopSpendingCategories from '../components/dashboard/TopSpendingCategories'
import UpcomingCommitments from '../components/dashboard/UpcomingCommitments'
import RecentTransactions from '../components/dashboard/RecentTransactions'
import QuickActions from '../components/dashboard/QuickActions'
import NotificationSummary from '../components/dashboard/NotificationSummary'
import PlanningNavGrid from '../components/dashboard/PlanningNavGrid'
import FinancialActionCenter from '../components/dashboard/FinancialActionCenter'
import FinancialHealth from '../components/dashboard/FinancialHealth'
import SafeToSpend from '../components/dashboard/SafeToSpend'
import QuickStartCards from '../components/dashboard/QuickStartCards'
import FinancialSnapshot from '../components/dashboard/FinancialSnapshot'
import { summarizeAccounts } from '../utils/finance/accountSummary'
import { DASHBOARD_PERIOD_OPTIONS } from '../constants/dashboard'
import styles from './HomePage.module.css'

const GREETING_BY_HOUR = (hour) => {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const HomePage = () => {
  const navigate = useNavigate()
  const {
    profile,
    period,
    setPeriod,
    accounts,
    accountsById,
    categoriesById,
    isLoading,
    isError,
    refetch,
    currency,
    metrics,
    breakdown,
    topCategories,
    recentTransactions,
    savingsTarget,
    actions,
    hasTransactions,
    hasOtherCurrencies,
    hasEverHadTransactions,
    isBrandNew,
    isProfileIncomplete,
  } = useActionDashboard()
  const planning = useActionDashboardPlanning()
  const commitments = useActionDashboardCommitments()
  const spendingPlan = useActionSpendingPlan()
  const financialHealth = useActionFinancialHealth(spendingPlan)

  const firstName = profile?.name?.split(' ')[0]
  const welcome = `${GREETING_BY_HOUR(new Date().getHours())}${firstName ? `, ${firstName}` : ''}`
  const periodLabel = DASHBOARD_PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? 'This month'
  const goToTransactions = () => navigate('/transactions')

  const accountPositionGroups = summarizeAccounts(accounts)
  const primaryAccountGroup =
    accountPositionGroups.find((group) => group.currency === currency) ?? accountPositionGroups[0] ?? null
  const otherAccountGroups = accountPositionGroups.filter((group) => group !== primaryAccountGroup)

  if (isLoading) {
    return (
      <div className={styles.dashboard}>
        <PageHeader title={welcome} />
        <Skeleton height="6rem" radius="var(--radius-lg)" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={styles.row}>
            <Skeleton height="12rem" radius="var(--radius-lg)" />
            <Skeleton height="12rem" radius="var(--radius-lg)" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return <ErrorState message="We couldn't load your dashboard." onRetry={refetch} />
  }

  if (isBrandNew) {
    return (
      <div className={styles.dashboard}>
        <PageHeader title={welcome} description="Let's set up your financial picture." />

        <QuickStartCards
          hasAccounts={accounts.length > 0}
          hasTransactions={hasEverHadTransactions}
          profileComplete={!isProfileIncomplete}
        />
      </div>
    )
  }

  return (
    <div className={styles.dashboard}>
      <PageHeader
        className={styles.pageHeader}
        title={welcome}
        description="Here's how your finances are looking this month."
        actions={
          <Select
            id="dashboard-period"
            label="Period"
            className={styles.periodSelect}
            options={DASHBOARD_PERIOD_OPTIONS}
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          />
        }
      />

      {isProfileIncomplete && (
        <div className={styles.banner}>
          <Icon name="alertTriangle" size="var(--icon-sm)" className={styles.bannerIcon} />
          <p className={`text-secondary ${styles.bannerText}`}>
            Your profile is incomplete — add your monthly income to get accurate insights.
          </p>
          <Button variant="secondary" onClick={() => navigate('/profile')}>
            Complete profile
          </Button>
        </div>
      )}

      {hasOtherCurrencies && (
        <p className={`text-caption ${styles.notice}`}>
          Some transactions use other currencies and aren&rsquo;t included in these totals.
        </p>
      )}

      <div className={styles.utilityRow}>
        <QuickActions />
      </div>

      <NotificationSummary />

      <div className={styles.section}>
        <FinancialSnapshot
          loading={false}
          primaryAccountGroup={primaryAccountGroup}
          otherAccountGroups={otherAccountGroups}
          metrics={metrics}
          currency={currency}
          periodLabel={periodLabel}
        />
      </div>

      <div className={`${styles.rowWide} ${styles.rowEqual}`}>
        <FinancialHealth
          isLoading={financialHealth.isLoading}
          isError={financialHealth.isError}
          refetch={financialHealth.refetch}
          areas={financialHealth.areas}
          priorities={financialHealth.priorities}
          isConfigured={financialHealth.isConfigured}
          overallStatus={financialHealth.overallStatus}
        />
        <SafeToSpend
          isLoading={spendingPlan.isLoading}
          isError={spendingPlan.isError}
          refetch={spendingPlan.refetch}
          currency={spendingPlan.currency}
          hasIncome={spendingPlan.hasIncome}
          isOverCommitted={spendingPlan.isOverCommitted}
          availableAmount={spendingPlan.availableAmount}
          overCommittedAmount={spendingPlan.overCommittedAmount}
          categories={spendingPlan.categories}
        />
      </div>

      <div className={`${styles.rowWide} ${styles.rowEqual}`}>
        <div className={styles.card}>
          <SpendingBreakdown breakdown={breakdown} currency={currency} />
        </div>
        <UpcomingCommitments upcoming={commitments.upcoming} dueOrOverdue={commitments.dueOrOverdue} />
      </div>

      <div className={styles.card}>
        <TopSpendingCategories
          categories={topCategories}
          currency={currency}
          hasEverHadTransactions={hasEverHadTransactions}
          periodLabel={periodLabel}
          onAddTransaction={goToTransactions}
        />
      </div>

      <div className={styles.section}>
        <Section title="Financial Planning">
          <PlanningNavGrid summary={planning} currency={currency} loading={planning.isLoading} />
        </Section>
      </div>

      <div className={`${styles.rowThree} ${styles.rowEqual}`}>
        <AccountPosition accounts={accounts} primaryCurrency={currency} />
        <SavingsTarget savingsTarget={savingsTarget} currency={currency} />
        <RecentTransactions
          transactions={recentTransactions}
          accountsById={accountsById}
          categoriesById={categoriesById}
          onAddTransaction={goToTransactions}
        />
      </div>

      <div className={styles.section}>
        <FinancialActionCenter actions={actions} hasTransactions={hasTransactions} onAddTransaction={goToTransactions} />
      </div>
    </div>
  )
}

export default HomePage
