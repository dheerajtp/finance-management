import { differenceInCalendarDays, parseISO } from 'date-fns'

// How much of a monthly budget this subscription effectively consumes,
// regardless of its actual billing cadence.
const MONTHLY_FACTOR = { weekly: 52 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 }
const ANNUAL_FACTOR = { weekly: 52, monthly: 12, quarterly: 4, yearly: 1 }

export const calculateMonthlyEquivalent = (amount, billingFrequency) =>
  (Number(amount) || 0) * (MONTHLY_FACTOR[billingFrequency] ?? 0)

export const calculateAnnualCost = (amount, billingFrequency) =>
  (Number(amount) || 0) * (ANNUAL_FACTOR[billingFrequency] ?? 0)

// Negative once the renewal date has passed without the record being
// updated — callers use the sign to detect an overdue subscription, so this
// deliberately does NOT clamp to zero the way goal countdowns do.
export const calculateDaysUntilRenewal = (nextBillingDate, today) =>
  differenceInCalendarDays(parseISO(nextBillingDate), today)

const RENEWING_SOON_WINDOW_DAYS = 7

export const getSubscriptionStatus = (subscription, today) => {
  if (!subscription.is_active) return 'inactive'

  const daysUntilRenewal = calculateDaysUntilRenewal(subscription.next_billing_date, today)
  if (daysUntilRenewal < 0) return 'overdue'
  if (daysUntilRenewal <= RENEWING_SOON_WINDOW_DAYS) return 'renewing_soon'
  return 'active'
}

// Monetary totals grouped by currency (never combined); counts are safe to
// combine across currencies. Expects subscriptions already decorated with
// monthlyEquivalent/annualCost/status (see useActionSubscription).
export const summarizeSubscriptions = (decoratedSubscriptions) => {
  const activeSubscriptions = decoratedSubscriptions.filter((subscription) => subscription.is_active)

  const monthlyByCurrency = new Map()
  const annualByCurrency = new Map()
  activeSubscriptions.forEach((subscription) => {
    monthlyByCurrency.set(
      subscription.currency,
      (monthlyByCurrency.get(subscription.currency) ?? 0) + subscription.monthlyEquivalent,
    )
    annualByCurrency.set(
      subscription.currency,
      (annualByCurrency.get(subscription.currency) ?? 0) + subscription.annualCost,
    )
  })

  return {
    active: activeSubscriptions.length,
    upcomingRenewals: activeSubscriptions.filter((subscription) => subscription.status === 'renewing_soon').length,
    overdue: activeSubscriptions.filter((subscription) => subscription.status === 'overdue').length,
    monthlyByCurrency: Array.from(monthlyByCurrency.entries()).map(([currency, total]) => ({ currency, total })),
    annualByCurrency: Array.from(annualByCurrency.entries()).map(([currency, total]) => ({ currency, total })),
  }
}

const STATUS_SORT_WEIGHT = { overdue: 0, renewing_soon: 1, active: 2, inactive: 3 }

// 1. active first, 2. overdue, then renewing soon, then everything else,
// 3. nearest renewal date first.
export const sortSubscriptions = (decoratedSubscriptions) => {
  return [...decoratedSubscriptions].sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1
    const statusDiff = (STATUS_SORT_WEIGHT[a.status] ?? 99) - (STATUS_SORT_WEIGHT[b.status] ?? 99)
    if (statusDiff !== 0) return statusDiff
    return a.next_billing_date.localeCompare(b.next_billing_date)
  })
}
