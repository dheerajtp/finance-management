import { differenceInCalendarDays, parseISO } from 'date-fns'
import { useDashboardCommitmentsData } from '../api/useDashboardApi'
import {
  calculateDaysUntilOccurrence,
  getRecurringTransactionStatus,
  sortRecurringTransactions,
} from '../../utils/finance/recurringTransactions'
import { calculateDaysUntilRenewal, getSubscriptionStatus } from '../../utils/finance/subscriptions'
import { calculateExpectedContributionDate, calculateContributionStatus } from '../../utils/finance/investments'

const UPCOMING_LIMIT = 5
const SIP_UPCOMING_STATUSES = new Set(['due', 'overdue', 'active'])

// Recurring transactions are the authoritative upcoming schedule (they carry
// real next_occurrence_date + frequency); subscriptions only ever fill in
// as supplementary items, and only when they're not already represented by
// a recurring transaction of the same name — the two features are
// deliberately never linked in the database (see 0011/0012 migration
// notes), so a same-name match is the only signal available to avoid
// showing one real-world commitment twice.
const useActionDashboardCommitments = () => {
  const { recurringTransactions, subscriptions, investmentPlans, investmentContributions, isLoading, isError, refetch } =
    useDashboardCommitmentsData()

  const today = new Date()

  const decoratedRecurring = recurringTransactions.map((item) => ({
    ...item,
    status: getRecurringTransactionStatus(item, today),
    daysUntilOccurrence: calculateDaysUntilOccurrence(item.next_occurrence_date, today),
  }))

  const activeRecurring = sortRecurringTransactions(decoratedRecurring.filter((item) => item.status !== 'ended'))
  const dueOrOverdue = activeRecurring.filter((item) => item.status === 'due' || item.status === 'overdue')

  const decoratedSubscriptions = subscriptions
    .map((subscription) => ({
      ...subscription,
      status: getSubscriptionStatus(subscription, today),
      daysUntilRenewal: calculateDaysUntilRenewal(subscription.next_billing_date, today),
    }))
    .filter((subscription) => subscription.status !== 'active')

  const recurringNames = new Set(
    activeRecurring.map((item) => (item.description ?? '').trim().toLowerCase()).filter(Boolean),
  )
  const supplementarySubscriptions = decoratedSubscriptions.filter(
    (subscription) => !recurringNames.has(subscription.name.trim().toLowerCase()),
  )

  // Same expected-date/status math useActionInvestmentPlan and Financial
  // Health already use (investments.js) — this only decorates for display,
  // never creates a contribution or transaction.
  const upcomingInvestmentPlans = investmentPlans
    .filter((plan) => plan.is_active)
    .map((plan) => {
      const planContributions = investmentContributions.filter((contribution) => contribution.plan_id === plan.id)
      const expectedDate = calculateExpectedContributionDate(plan, today)
      return {
        ...plan,
        status: calculateContributionStatus(plan, planContributions, today),
        daysUntilContribution: differenceInCalendarDays(parseISO(expectedDate), today),
      }
    })
    .filter((plan) => SIP_UPCOMING_STATUSES.has(plan.status))

  const upcoming = [
    ...activeRecurring.map((item) => ({
      id: `recurring-${item.id}`,
      name: item.description || `Recurring ${item.type}`,
      amount: item.amount,
      currency: item.currency,
      type: item.type,
      daysUntil: item.daysUntilOccurrence,
      status: item.status,
      source: 'recurring',
    })),
    ...upcomingInvestmentPlans.map((plan) => ({
      id: `investment-plan-${plan.id}`,
      name: plan.name,
      amount: plan.amount,
      currency: plan.currency,
      type: 'investment',
      daysUntil: plan.daysUntilContribution,
      status: plan.status,
      source: 'investment_plan',
    })),
    ...supplementarySubscriptions.map((subscription) => ({
      id: `subscription-${subscription.id}`,
      name: subscription.name,
      amount: subscription.amount,
      currency: subscription.currency,
      type: 'expense',
      daysUntil: subscription.daysUntilRenewal,
      status: subscription.status,
      source: 'subscription',
    })),
  ]
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, UPCOMING_LIMIT)

  return {
    isLoading,
    isError,
    refetch,
    upcoming,
    dueOrOverdue,
    dueCount: dueOrOverdue.filter((item) => item.status === 'due').length,
    overdueCount: dueOrOverdue.filter((item) => item.status === 'overdue').length,
  }
}

export default useActionDashboardCommitments
