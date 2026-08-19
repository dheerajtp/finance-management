import { EMERGENCY_FUND_MILESTONES } from '../../constants/emergencyFund'

// Milestones are derived, not stored — the next unreached milestone and how
// much more (in currency) is needed to reach it.
export const calculateNextMilestone = (progress, target) => {
  if (progress === null || progress === undefined || target === null || target === undefined) return null
  if (progress >= 100) return null

  const nextPercentage = EMERGENCY_FUND_MILESTONES.find((milestone) => milestone > progress)
  if (!nextPercentage) return null

  const milestoneAmount = (target * nextPercentage) / 100
  const currentAmount = (target * progress) / 100

  return { percentage: nextPercentage, amountRemaining: Math.max(0, milestoneAmount - currentAmount) }
}
