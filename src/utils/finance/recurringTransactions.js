import {
  addWeeks,
  addMonths,
  addQuarters,
  addYears,
  parseISO,
  format,
  isAfter,
  differenceInCalendarDays,
  getDate,
  getDaysInMonth,
  setDate,
} from 'date-fns'
import { calculateMonthlyEquivalent as calculateSubscriptionMonthlyEquivalent, calculateAnnualCost } from './subscriptions'

const DATE_FORMAT = 'yyyy-MM-dd'

const ADD_BY_FREQUENCY = { weekly: addWeeks, monthly: addMonths, quarterly: addQuarters, yearly: addYears }

// Clamps a target day-of-month to the last valid day of that month (e.g. day
// 31 in February becomes 28/29) — same helper as utils/finance/investments.js.
const clampToMonth = (monthDate, day) => setDate(monthDate, Math.min(day, getDaysInMonth(monthDate)))

// +7 days for weekly, +1/+3/+12 calendar months otherwise — date-fns handles
// the calendar arithmetic, never an approximate 30-day step. parseISO/format
// keep this on date-only values, no timezone-sensitive
// `new Date('yyyy-MM-dd')` parsing anywhere.
//
// `startDate` (optional, ignored for weekly) re-anchors monthly/quarterly/
// yearly steps to the day-of-month the schedule actually started on —
// without it, date-fns' one-time month-end clamp would drift permanently:
// Jan 31 -> Feb 28 -> addMonths(Feb 28, 1) = Mar 28, never back to 31. With
// it, Jan 31 -> Feb 28 -> Mar 31, matching calculateExpectedContributionDate
// in investments.js.
export const calculateNextOccurrence = (occurrenceDate, frequency, startDate) => {
  const stepped = ADD_BY_FREQUENCY[frequency](parseISO(occurrenceDate), 1)
  if (frequency === 'weekly' || !startDate) return format(stepped, DATE_FORMAT)
  return format(clampToMonth(stepped, getDate(parseISO(startDate))), DATE_FORMAT)
}

export const calculateDaysUntilOccurrence = (nextOccurrenceDate, today) =>
  differenceInCalendarDays(parseISO(nextOccurrenceDate), today)

export const getRecurringTransactionStatus = (recurringTransaction, today) => {
  if (!recurringTransaction.is_active) return 'inactive'

  if (recurringTransaction.end_date && isAfter(parseISO(recurringTransaction.next_occurrence_date), parseISO(recurringTransaction.end_date))) {
    return 'ended'
  }

  const daysUntil = calculateDaysUntilOccurrence(recurringTransaction.next_occurrence_date, today)
  if (daysUntil < 0) return 'overdue'
  if (daysUntil === 0) return 'due'
  return 'upcoming'
}

// Same monthly/annual conversion as subscriptions (utils/finance/
// subscriptions.js) — recurring transactions use the same four
// frequencies, so this reuses that math instead of re-deriving it.
export const calculateMonthlyEquivalent = calculateSubscriptionMonthlyEquivalent
export const calculateAnnualEquivalent = calculateAnnualCost

const STATUS_SORT_WEIGHT = { overdue: 0, due: 1, upcoming: 2, ended: 3, inactive: 4 }

// 1. active first, 2. overdue, then due, then upcoming, then ended,
// 3. nearest occurrence date first.
export const sortRecurringTransactions = (decoratedRecurringTransactions) => {
  return [...decoratedRecurringTransactions].sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1
    const statusDiff = (STATUS_SORT_WEIGHT[a.status] ?? 99) - (STATUS_SORT_WEIGHT[b.status] ?? 99)
    if (statusDiff !== 0) return statusDiff
    return a.next_occurrence_date.localeCompare(b.next_occurrence_date)
  })
}

// Monetary totals grouped by currency (never combined); counts are safe to
// combine across currencies. Expects items already decorated with `status`
// via useActionRecurringTransaction. "ended" items keep counting toward
// `active` (is_active is still true) but drop out of the commitment totals
// — they no longer represent ongoing recurring spend/income.
export const summarizeRecurringTransactions = (decoratedRecurringTransactions) => {
  const activeItems = decoratedRecurringTransactions.filter((item) => item.is_active)
  const commitmentItems = activeItems.filter((item) => item.status !== 'ended')

  const monthlyByCurrency = new Map()
  const annualByCurrency = new Map()
  commitmentItems.forEach((item) => {
    monthlyByCurrency.set(item.currency, (monthlyByCurrency.get(item.currency) ?? 0) + item.monthlyEquivalent)
    annualByCurrency.set(item.currency, (annualByCurrency.get(item.currency) ?? 0) + item.annualEquivalent)
  })

  return {
    active: activeItems.length,
    due: activeItems.filter((item) => item.status === 'due').length,
    upcoming: activeItems.filter((item) => item.status === 'upcoming').length,
    overdue: activeItems.filter((item) => item.status === 'overdue').length,
    monthlyByCurrency: Array.from(monthlyByCurrency.entries()).map(([currency, total]) => ({ currency, total })),
    annualByCurrency: Array.from(annualByCurrency.entries()).map(([currency, total]) => ({ currency, total })),
  }
}
