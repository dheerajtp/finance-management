// Account/holding/plan options are dynamic, so these forms aren't generic
// field loops — this file just centralizes labels used across all three
// investment forms.
export const investmentHoldingFieldLabels = {
  name: 'Name',
  type: 'Investment type',
  account: 'Investment account',
  currency: 'Currency',
  investedAmount: 'Invested amount',
  currentValue: 'Current value',
}

export const investmentPlanFieldLabels = {
  name: 'Plan name',
  amount: 'Contribution amount',
  currency: 'Currency',
  frequency: 'Frequency',
  contributionDay: 'Contribution day',
  startDate: 'Start date',
  endDate: 'End date',
}

export const investmentContributionFieldLabels = {
  plan: 'Related SIP',
  amount: 'Amount',
  contributionDate: 'Contribution date',
  status: 'Status',
  notes: 'Notes',
}

export const CONTRIBUTION_STATUS_OPTIONS = [
  { value: 'completed', label: 'Completed' },
  { value: 'skipped', label: 'Skipped' },
]
