import { getAccountClassification } from '../../constants/accountTypes'

// Groups active accounts by currency and sums assets/liabilities within each
// group. Cross-currency conversion is out of scope for this MVP — mixing
// currencies into one total would silently misrepresent the numbers.
// 'other'/unclassified accounts are excluded from both totals.
export const summarizeAccounts = (accounts) => {
  const groups = new Map()

  accounts
    .filter((account) => account.is_active)
    .forEach((account) => {
      const classification = getAccountClassification(account.type)
      const amount = Number(account.balance) || 0

      if (!groups.has(account.currency)) {
        groups.set(account.currency, { currency: account.currency, totalAssets: 0, totalLiabilities: 0 })
      }
      const group = groups.get(account.currency)

      if (classification === 'asset') {
        group.totalAssets += amount
      } else if (classification === 'liability') {
        group.totalLiabilities += amount
      }
    })

  return Array.from(groups.values()).map((group) => ({
    ...group,
    netPosition: group.totalAssets - group.totalLiabilities,
  }))
}
