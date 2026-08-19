// Shared between HomePage's period selector and the Settings page, which
// lets a user pick which of these is preselected on load.
export const DASHBOARD_PERIOD_OPTIONS = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'last_3_months', label: 'Last 3 months' },
  { value: 'last_6_months', label: 'Last 6 months' },
]

export const DEFAULT_DASHBOARD_PERIOD = 'this_month'
