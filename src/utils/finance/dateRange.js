import { startOfMonth, endOfMonth, subMonths, format, eachMonthOfInterval } from 'date-fns'

const DATE_FORMAT = 'yyyy-MM-dd'
const MONTH_KEY_FORMAT = 'yyyy-MM'

export const getCurrentMonthRange = () => {
  const now = new Date()
  return { start: format(startOfMonth(now), DATE_FORMAT), end: format(endOfMonth(now), DATE_FORMAT) }
}

export const getLastMonthRange = () => {
  const lastMonth = subMonths(new Date(), 1)
  return { start: format(startOfMonth(lastMonth), DATE_FORMAT), end: format(endOfMonth(lastMonth), DATE_FORMAT) }
}

export const getPeriodRange = (period) => {
  if (period === 'last_month') return getLastMonthRange()
  if (period === 'last_3_months') return getLastNMonthsRange(3)
  if (period === 'last_6_months') return getLastNMonthsRange(6)
  return getCurrentMonthRange()
}

// A single continuous range covering the last N months, including the
// current (in-progress) month.
export const getLastNMonthsRange = (months) => {
  const now = new Date()
  return {
    start: format(startOfMonth(subMonths(now, months - 1)), DATE_FORMAT),
    end: format(endOfMonth(now), DATE_FORMAT),
  }
}

// Ordered (oldest → newest) month descriptors covering the last N months,
// including the current month — the single source of truth for "which
// months are in play" that trend/baseline calculations build on, so nothing
// re-derives month boundaries independently and risks disagreeing about
// which month is "current".
export const getMonthBuckets = (months) => {
  const now = new Date()
  const start = startOfMonth(subMonths(now, months - 1))
  const end = startOfMonth(now)
  const currentKey = format(now, MONTH_KEY_FORMAT)

  return eachMonthOfInterval({ start, end }).map((monthStart) => ({
    key: format(monthStart, MONTH_KEY_FORMAT),
    label: format(monthStart, 'MMM'),
    start: format(startOfMonth(monthStart), DATE_FORMAT),
    end: format(endOfMonth(monthStart), DATE_FORMAT),
    isCurrentMonth: format(monthStart, MONTH_KEY_FORMAT) === currentKey,
  }))
}
