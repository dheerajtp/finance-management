import { format, parseISO, endOfDay, differenceInCalendarDays } from 'date-fns'
import { getRecurringTransactionStatus, calculateDaysUntilOccurrence } from './recurringTransactions'
import { calculateDaysUntilRenewal } from './subscriptions'
import { calculateExpectedContributionDate, calculateContributionStatus } from './investments'
import { EMERGENCY_FUND_MILESTONES } from '../../constants/emergencyFund'

// Pure, deterministic, no Supabase access anywhere in this file (see task
// notes: detection and persistence are separate layers). Every function
// takes already-fetched data + `today` and returns a plain array of
// notification candidates — { type, severity, title, message, entityType,
// entityId, actionPath, dedupeKey, expiresAt } — for useNotificationSync to
// persist. The dedupe_key on each candidate is the actual duplicate
// prevention: the unique (user_id, dedupe_key) index in 0014 means
// re-running these rules against unchanged data is always safe to attempt
// again — the database silently rejects anything already created.

const RECURRING_UPCOMING_WINDOW_DAYS = 3
const SUBSCRIPTION_UPCOMING_WINDOW_DAYS = 3
const INVESTMENT_UPCOMING_WINDOW_DAYS = 3
const GOAL_MILESTONES = [25, 50, 75, 100]

const dayWord = (days) => `${days} day${days === 1 ? '' : 's'}`

export const detectRecurringNotifications = (recurringTransactions, today) => {
  const candidates = []

  recurringTransactions
    .filter((item) => item.is_active)
    .forEach((item) => {
      const status = getRecurringTransactionStatus(item, today)
      const daysUntil = calculateDaysUntilOccurrence(item.next_occurrence_date, today)
      const name = item.description || `Recurring ${item.type}`
      // A "due" notification is stale once its occurrence date has passed
      // (it becomes overdue instead) — expiring it keeps the notification
      // list from showing a now-inaccurate "due in 3 days" forever.
      const expiresAt = endOfDay(parseISO(item.next_occurrence_date)).toISOString()

      if (status === 'overdue') {
        candidates.push({
          type: 'recurring_overdue',
          severity: 'warning',
          title: `${name} is overdue`,
          message: `${name} was due on ${item.next_occurrence_date} and hasn't been recorded yet.`,
          entityType: 'recurring_transaction',
          entityId: item.id,
          actionPath: '/recurring-transactions',
          dedupeKey: `recurring_overdue:${item.id}:${item.next_occurrence_date}`,
        })
      } else if (status === 'due' || daysUntil <= RECURRING_UPCOMING_WINDOW_DAYS) {
        candidates.push({
          type: 'recurring_due',
          severity: 'info',
          title: daysUntil === 0 ? `${name} is due today` : `${name} is due in ${dayWord(daysUntil)}`,
          message: daysUntil === 0 ? `${name} is due today.` : `${name} is due in ${dayWord(daysUntil)}.`,
          entityType: 'recurring_transaction',
          entityId: item.id,
          actionPath: '/recurring-transactions',
          dedupeKey: `recurring_due:${item.id}:${item.next_occurrence_date}`,
          expiresAt,
        })
      }
    })

  return candidates
}

export const detectSubscriptionNotifications = (subscriptions, today) => {
  const candidates = []

  subscriptions
    .filter((subscription) => subscription.is_active)
    .forEach((subscription) => {
      const daysUntil = calculateDaysUntilRenewal(subscription.next_billing_date, today)
      if (daysUntil < 0 || daysUntil > SUBSCRIPTION_UPCOMING_WINDOW_DAYS) return

      const expiresAt = endOfDay(parseISO(subscription.next_billing_date)).toISOString()
      const isDueToday = daysUntil === 0

      candidates.push({
        type: isDueToday ? 'subscription_due' : 'subscription_upcoming',
        severity: 'info',
        title: isDueToday ? `${subscription.name} renews today` : `${subscription.name} renews in ${dayWord(daysUntil)}`,
        message: isDueToday
          ? `${subscription.name} renews today.`
          : `${subscription.name} renews in ${dayWord(daysUntil)}.`,
        entityType: 'subscription',
        entityId: subscription.id,
        actionPath: '/subscriptions',
        dedupeKey: `${isDueToday ? 'subscription_due' : 'subscription_upcoming'}:${subscription.id}:${subscription.next_billing_date}`,
        expiresAt,
      })
    })

  return candidates
}

// Never fires for a plan that's merely "active" with time left — only once
// it's actually due or overdue, same trigger condition as
// detectRecurringNotifications. Never creates a contribution or touches
// accounts.balance/holding values — this only ever reads.
export const detectInvestmentNotifications = (investmentPlans, investmentContributions, today) => {
  const candidates = []

  investmentPlans
    .filter((plan) => plan.is_active)
    .forEach((plan) => {
      const expectedDate = calculateExpectedContributionDate(plan, today)
      const planContributions = investmentContributions.filter((contribution) => contribution.plan_id === plan.id)
      const status = calculateContributionStatus(plan, planContributions, today)
      const daysUntil = differenceInCalendarDays(parseISO(expectedDate), today)

      if (status === 'overdue') {
        candidates.push({
          type: 'investment_overdue',
          severity: 'warning',
          title: `${plan.name} is overdue`,
          message: `${plan.name} was due on ${expectedDate} and hasn't been recorded yet.`,
          entityType: 'investment_plan',
          entityId: plan.id,
          actionPath: '/investments',
          dedupeKey: `investment_overdue:${plan.id}:${expectedDate}`,
        })
      } else if (status === 'due' || (daysUntil >= 0 && daysUntil <= INVESTMENT_UPCOMING_WINDOW_DAYS)) {
        const expiresAt = endOfDay(parseISO(expectedDate)).toISOString()
        candidates.push({
          type: 'investment_due',
          severity: 'info',
          title: daysUntil === 0 ? `${plan.name} is due today` : `${plan.name} is due in ${dayWord(daysUntil)}`,
          message: daysUntil === 0 ? `${plan.name} is due today.` : `${plan.name} is due in ${dayWord(daysUntil)}.`,
          entityType: 'investment_plan',
          entityId: plan.id,
          actionPath: '/investments',
          dedupeKey: `investment_due:${plan.id}:${expectedDate}`,
          expiresAt,
        })
      }
    })

  return candidates
}

const BUDGET_NOTIFIABLE_STATUSES = new Set(['attention', 'near_limit', 'over_budget'])

// Dedupe basis is budget + calendar month + status (not just budget +
// month) — appended to the key on purpose, so a budget escalating from
// "attention" to "over_budget" within the same month still gets its own
// notification instead of being silently suppressed by the earlier one.
export const detectBudgetNotifications = (decoratedBudgets, today, formatCurrency) => {
  const yearMonth = format(today, 'yyyy-MM')

  return decoratedBudgets
    .filter((budget) => BUDGET_NOTIFIABLE_STATUSES.has(budget.status))
    .map((budget) => {
      const isOver = budget.status === 'over_budget'
      const type = isOver ? 'budget_over_limit' : 'budget_attention'
      const spent = formatCurrency(budget.spent, budget.currency)
      const amount = formatCurrency(budget.amount, budget.currency)

      return {
        type,
        severity: 'warning',
        title: isOver ? `${budget.categoryName} is over budget` : `${budget.categoryName} is approaching its limit`,
        message: isOver
          ? `${budget.categoryName} is at ${spent} of its ${amount} budget.`
          : `${budget.categoryName} is at ${spent} of its ${amount} budget (${Math.round(budget.progress)}%).`,
        entityType: 'budget',
        entityId: budget.id,
        actionPath: '/budgets',
        dedupeKey: `${type}:${budget.id}:${yearMonth}:${budget.status}`,
      }
    })
}

// Milestones already reached (progress >= milestone) are all emitted every
// time this runs — the unique dedupe index (not any state tracked here) is
// what guarantees each one only ever notifies once. This is what makes
// "a milestone, once reached, stays reached" true without needing to
// remember a goal's previous progress.
export const detectGoalNotifications = (decoratedGoals) => {
  const candidates = []

  decoratedGoals
    .filter((goal) => goal.is_active)
    .forEach((goal) => {
      GOAL_MILESTONES.filter((milestone) => goal.progress >= milestone).forEach((milestone) => {
        if (milestone === 100) {
          candidates.push({
            type: 'goal_target_reached',
            severity: 'success',
            title: `${goal.name} reached its target`,
            message: `${goal.name} reached its target.`,
            entityType: 'goal',
            entityId: goal.id,
            actionPath: `/goals/${goal.id}`,
            dedupeKey: `goal_target_reached:${goal.id}`,
          })
        } else {
          candidates.push({
            type: 'goal_milestone',
            severity: 'success',
            title: `${goal.name} reached ${milestone}%`,
            message: `${goal.name} reached ${milestone}% of its target.`,
            entityType: 'goal',
            entityId: goal.id,
            actionPath: `/goals/${goal.id}`,
            dedupeKey: `goal_milestone:${goal.id}:${milestone}`,
          })
        }
      })
    })

  return candidates
}

// Same "emit every crossed milestone, let the dedupe index decide" approach
// as detectGoalNotifications. Reuses the existing EMERGENCY_FUND_MILESTONES
// definition (constants/emergencyFund.js) rather than a second one.
export const detectEmergencyFundNotifications = (emergencyFundStatus) => {
  if (!emergencyFundStatus.configured || emergencyFundStatus.progress === null || emergencyFundStatus.progress === undefined) {
    return []
  }

  return EMERGENCY_FUND_MILESTONES.filter((milestone) => emergencyFundStatus.progress >= milestone).map((milestone) => {
    if (milestone === 100) {
      return {
        type: 'emergency_fund_target_reached',
        severity: 'success',
        title: 'Emergency fund reached its target',
        message: 'Your emergency fund reached its target.',
        entityType: 'emergency_fund',
        entityId: null,
        actionPath: '/emergency-fund',
        dedupeKey: 'emergency_fund_target_reached',
      }
    }
    return {
      type: 'emergency_fund_milestone',
      severity: 'success',
      title: `Emergency fund reached ${milestone}%`,
      message: `Your emergency fund reached ${milestone}% of its target.`,
      entityType: 'emergency_fund',
      entityId: null,
      actionPath: '/emergency-fund',
      dedupeKey: `emergency_fund_milestone:${milestone}`,
    }
  })
}

// Fires at most once ever per user — completing the profile is a one-time
// action, not something that needs repeated reminding once dismissed/read.
export const detectProfileNotifications = (profile, userId) => {
  const isComplete = Boolean(profile) && profile.monthly_income !== null && profile.monthly_income !== undefined
  if (isComplete || !userId) return []

  return [
    {
      type: 'profile_incomplete',
      severity: 'info',
      title: 'Complete your financial profile',
      message: 'Add your monthly income to get accurate insights across the app.',
      entityType: 'profile',
      entityId: null,
      actionPath: '/profile',
      dedupeKey: `profile_incomplete:${userId}`,
    },
  ]
}

// "At most once per relevant analysis period" — the year-month is part of
// the dedupe key, so this can surface again in a later month if spending
// history is still insufficient, but never twice within the same one.
export const detectFinancialFreedomNotifications = (financialFreedomStatus, today) => {
  if (!financialFreedomStatus.configured || financialFreedomStatus.hasSpendingHistory) return []

  const yearMonth = format(today, 'yyyy-MM')
  return [
    {
      type: 'financial_freedom_insufficient_history',
      severity: 'info',
      title: 'More spending history needed',
      message: 'More spending history is needed to calculate your FI target.',
      entityType: 'financial_freedom',
      entityId: null,
      actionPath: '/financial-freedom',
      dedupeKey: `financial_freedom_insufficient_history:${yearMonth}`,
    },
  ]
}
