import { getAccountClassification } from '../../constants/accountTypes'
import { summarizeAccounts } from './accountSummary'

const toAmount = (balance) => Number(balance) || 0
const byBalanceDesc = (a, b) => toAmount(b.balance) - toAmount(a.balance)

// Active accounts grouped by net-worth classification: asset | liability |
// unknown. 'unknown' ('other' account type) is surfaced here — callers decide
// how to display it — but is never part of an asset/liability total.
export const groupAccountsByNetWorthClassification = (accounts) => {
  const groups = { asset: [], liability: [], unknown: [] }
  accounts
    .filter((account) => account.is_active)
    .forEach((account) => groups[getAccountClassification(account.type)].push(account))
  return groups
}

// assets - liabilities for a single set of same-currency accounts.
export const calculateNetWorth = (accounts) => {
  const { asset, liability } = groupAccountsByNetWorthClassification(accounts)
  const sum = (list) => list.reduce((total, account) => total + toAmount(account.balance), 0)
  return sum(asset) - sum(liability)
}

// Reuses the same per-currency assets/liabilities/netPosition totals already
// powering the dashboard/accounts "Net Position" card (summarizeAccounts),
// and attaches the individual accounts (largest balance first) behind each
// total. Currencies with no asset/liability accounts (only unclassified
// 'other' accounts) are dropped — there's nothing meaningful to show.
export const calculateNetWorthByCurrency = (accounts) => {
  const { asset, liability } = groupAccountsByNetWorthClassification(accounts)

  return summarizeAccounts(accounts)
    .map((totals) => ({
      ...totals,
      assetAccounts: asset.filter((account) => account.currency === totals.currency).sort(byBalanceDesc),
      liabilityAccounts: liability.filter((account) => account.currency === totals.currency).sort(byBalanceDesc),
    }))
    .filter((group) => group.assetAccounts.length > 0 || group.liabilityAccounts.length > 0)
}

// Everything the Net Worth page needs: per-currency breakdowns plus any
// unclassified accounts, which never enter the totals above.
export const summarizeNetWorth = (accounts) => ({
  byCurrency: calculateNetWorthByCurrency(accounts),
  unknownAccounts: groupAccountsByNetWorthClassification(accounts).unknown,
})

const sumByCurrency = (accounts) => {
  const totals = new Map()
  accounts.forEach((account) => {
    totals.set(account.currency, (totals.get(account.currency) ?? 0) + toAmount(account.balance))
  })
  return Array.from(totals.entries()).map(([currency, total]) => ({ currency, total }))
}

export const calculateAssetsByCurrency = (accounts) =>
  sumByCurrency(groupAccountsByNetWorthClassification(accounts).asset)

export const calculateLiabilitiesByCurrency = (accounts) =>
  sumByCurrency(groupAccountsByNetWorthClassification(accounts).liability)

// There is deliberately no historical net worth snapshot table for this
// MVP, so `previous` only ever comes from a real source a caller already
// has — never invented here. null in, null out — callers show "No
// historical comparison yet," never a fabricated 0% change.
export const calculateNetWorthChange = (current, previous) => {
  if (previous === null || previous === undefined || !Number.isFinite(Number(previous))) return null
  return (Number(current) || 0) - Number(previous)
}

export const calculateNetWorthPercentageChange = (current, previous) => {
  if (previous === null || previous === undefined) return null
  const previousNumber = Number(previous)
  if (!Number.isFinite(previousNumber) || previousNumber === 0) return null
  return (((Number(current) || 0) - previousNumber) / Math.abs(previousNumber)) * 100
}
