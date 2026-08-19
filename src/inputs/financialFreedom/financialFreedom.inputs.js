// FI accounts is a multi-select rendered as checkboxes (managed as its own
// piece of hook state, not through RHF register) — the rest of the form
// fits the generic Select/Input pattern used elsewhere, so this file mostly
// centralizes labels.
export const financialFreedomFieldLabels = {
  analysisMonths: 'Analysis period',
  fiMultiplier: 'FI multiplier',
  expectedAnnualReturn: 'Assumed annual return',
  monthlyContribution: 'Monthly contribution',
  fiAccounts: 'FI accounts',
}
