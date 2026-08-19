// Strips the redundant user_id from an exported row — every row belongs to
// the same exporting user, so it adds nothing and isn't the user's data to
// begin with.
const stripUserId = (record) => {
  if (!record) return record
  const copy = { ...record }
  delete copy.user_id
  return copy
}

// Pure data shaping only — no fetching, no DOM. Built from data the caller
// already has via the normal RLS-scoped query hooks.
export const buildAccountDataExport = ({
  email,
  accounts,
  categories,
  transactions,
  goals,
  budgets,
  emergencyFundSettings,
  financialFreedomSettings,
}) => ({
  exportedAt: new Date().toISOString(),
  account: email,
  accounts: accounts.map(stripUserId),
  categories: categories.map(stripUserId),
  transactions: transactions.map(stripUserId),
  goals: goals.map(stripUserId),
  budgets: budgets.map(stripUserId),
  emergencyFundSettings: stripUserId(emergencyFundSettings),
  financialFreedomSettings: stripUserId(financialFreedomSettings),
})
