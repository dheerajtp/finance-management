// `target` should already be null/undefined unless it's in the same currency
// as `actual` — comparing mismatched currencies would be meaningless. See
// useActionDashboard.js for where that guard is applied.
export const calculateSavingsTargetStatus = (actual, target) => {
  const hasTarget = typeof target === 'number' && target > 0

  return {
    hasTarget,
    actual,
    target: hasTarget ? target : 0,
    difference: hasTarget ? actual - target : null,
    // Negative actual still shows as 0% progress, but `actual`/`difference`
    // above still carry the true (negative) numbers for display.
    progress: hasTarget ? Math.min(100, Math.max(0, (actual / target) * 100)) : null,
  }
}
