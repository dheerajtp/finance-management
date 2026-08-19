// The form's fields are heterogeneous enough (a static select, a money
// input, and a dynamically-filtered account select) that it doesn't fit the
// generic field-array loop used elsewhere — this file centralizes labels,
// the form itself stays explicit JSX.
export const emergencyFundFieldLabels = {
  targetMonths: 'Target duration',
  monthlyContribution: 'Monthly contribution',
  emergencyAccount: 'Emergency fund account',
}
