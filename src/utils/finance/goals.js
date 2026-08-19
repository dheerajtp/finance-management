import { differenceInCalendarDays, differenceInCalendarMonths, parseISO } from 'date-fns'

export const calculateGoalRemaining = (targetAmount, currentAmount) =>
  Math.max(0, (Number(targetAmount) || 0) - (Number(currentAmount) || 0))

export const calculateGoalProgress = (targetAmount, currentAmount) => {
  const target = Number(targetAmount) || 0
  if (target <= 0) return 0
  return Math.min(100, Math.max(0, ((Number(currentAmount) || 0) / target) * 100))
}

export const calculateGoalDaysRemaining = (targetDate, today) => {
  if (!targetDate) return null
  return Math.max(0, differenceInCalendarDays(parseISO(targetDate), today))
}

// null = no target date, can't estimate. 0 = already there. Otherwise
// remaining / calendar months left — if the target falls within the current
// month, the whole remaining amount is due now (not divided by a fractional
// month).
export const calculateRequiredMonthlyContribution = (targetAmount, currentAmount, targetDate, today) => {
  const remaining = calculateGoalRemaining(targetAmount, currentAmount)
  if (remaining <= 0) return 0
  if (!targetDate) return null

  const monthsRemaining = differenceInCalendarMonths(parseISO(targetDate), today)
  if (monthsRemaining <= 0) return remaining
  return remaining / monthsRemaining
}

const calculateTimeElapsedPercentage = (createdAt, targetDate, today) => {
  if (!createdAt || !targetDate) return null
  const start = parseISO(createdAt)
  const end = parseISO(targetDate)
  const totalDays = differenceInCalendarDays(end, start)
  if (totalDays <= 0) return 100
  const elapsedDays = differenceInCalendarDays(today, start)
  return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100))
}

// "On track" is a progress-position assessment against elapsed time, not a
// prediction — current_amount is expected to already be the combined total
// of goal_contributions (0010) plus any goal_transaction_allocations (0013)
// by the time it reaches this function (see useActionGoal), but this is
// still not a velocity-based forecast either way.
export const calculateGoalStatus = (goal, today) => {
  if (!goal.is_active) return 'inactive'

  const progress = calculateGoalProgress(goal.target_amount, goal.current_amount)
  if (progress >= 100) return 'target_reached'

  if (!goal.target_date) return 'no_target_date'

  const timeElapsed = calculateTimeElapsedPercentage(goal.created_at, goal.target_date, today)
  // Conservative fallback if creation date is unavailable/invalid: without a
  // time reference, don't claim "on track".
  if (timeElapsed === null) return 'behind'

  return progress >= timeElapsed ? 'on_track' : 'behind'
}

export const calculateGoalMetrics = (goal, today) => ({
  remaining: calculateGoalRemaining(goal.target_amount, goal.current_amount),
  progress: calculateGoalProgress(goal.target_amount, goal.current_amount),
  requiredMonthlyContribution: calculateRequiredMonthlyContribution(
    goal.target_amount,
    goal.current_amount,
    goal.target_date,
    today,
  ),
  daysRemaining: calculateGoalDaysRemaining(goal.target_date, today),
  status: calculateGoalStatus(goal, today),
})

// Deterministic, non-motivational — one line per status, grounded in the
// actual numbers.
export const getGoalInsightMessage = (status, remaining, currency, formatCurrency) => {
  switch (status) {
    case 'target_reached':
      return 'Target reached.'
    case 'inactive':
      return 'This goal is inactive.'
    case 'no_target_date':
      return `${formatCurrency(remaining, currency)} remaining to reach this goal. No target date set.`
    case 'on_track':
      return "You're on or ahead of the planned timeline."
    case 'behind':
      return 'Your funding progress is behind the time elapsed.'
    default:
      return ''
  }
}

const STATUS_SORT_WEIGHT = { behind: 0, on_track: 1, no_target_date: 2, target_reached: 3, inactive: 4 }

// 1. active first, 2. high priority first, 3. behind goals first, 4. nearest
// target date first. Requires each goal to already carry a `.status`.
export const sortGoals = (goalsWithStatus) => {
  return [...goalsWithStatus].sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1
    if (a.priority !== b.priority) return a.priority - b.priority
    const statusDiff = (STATUS_SORT_WEIGHT[a.status] ?? 99) - (STATUS_SORT_WEIGHT[b.status] ?? 99)
    if (statusDiff !== 0) return statusDiff
    if (a.target_date && b.target_date) return a.target_date.localeCompare(b.target_date)
    if (a.target_date) return -1
    if (b.target_date) return 1
    return 0
  })
}

// Counts + remaining-amount grouped by currency — never summed across
// currencies. Expects goals already decorated via calculateGoalMetrics.
export const summarizeGoals = (goalsWithMetrics) => {
  const activeGoals = goalsWithMetrics.filter((goal) => goal.is_active)

  const remainingByCurrency = new Map()
  activeGoals
    .filter((goal) => goal.status !== 'target_reached')
    .forEach((goal) => {
      remainingByCurrency.set(goal.currency, (remainingByCurrency.get(goal.currency) ?? 0) + goal.remaining)
    })

  return {
    active: activeGoals.length,
    onTrack: activeGoals.filter((goal) => goal.status === 'on_track').length,
    behind: activeGoals.filter((goal) => goal.status === 'behind').length,
    reached: activeGoals.filter((goal) => goal.status === 'target_reached').length,
    remainingByCurrency: Array.from(remainingByCurrency.entries()).map(([currency, remaining]) => ({
      currency,
      remaining,
    })),
  }
}
