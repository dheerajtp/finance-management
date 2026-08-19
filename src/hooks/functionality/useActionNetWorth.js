import { useMemo, useState } from 'react'
import { useNetWorthQuery } from '../api/useNetWorthApi'
import { summarizeNetWorth } from '../../utils/finance/netWorth'
import { getAccountClassification } from '../../constants/accountTypes'

const useActionNetWorth = () => {
  const netWorthQuery = useNetWorthQuery()
  const [showInactive, setShowInactive] = useState(false)

  // useMemo so `accounts`/derived groupings keep a stable reference across
  // renders when the underlying query data hasn't changed (netWorthQuery.data
  // is undefined until loaded, and a fresh `[]` literal every render would
  // otherwise recompute summarizeNetWorth needlessly).
  const accounts = useMemo(() => netWorthQuery.data ?? [], [netWorthQuery.data])
  const { byCurrency, unknownAccounts } = useMemo(() => summarizeNetWorth(accounts), [accounts])

  const inactiveAccounts = useMemo(() => accounts.filter((account) => !account.is_active), [accounts])

  // The flat "account composition" list — only accounts actually included
  // in net worth (asset/liability classified; 'unknown' ones are already
  // covered by the separate unclassified-accounts notice, not repeated
  // here). Active always; inactive ones only appended when the
  // transparency toggle is on, and always tagged `isActive: false` so the
  // list can visually mark them as excluded rather than implying they
  // count toward any total.
  const accountListEntries = useMemo(() => {
    const decorate = (account) => ({ ...account, classification: getAccountClassification(account.type) })
    const isIncluded = (account) => getAccountClassification(account.type) !== 'unknown'
    const active = accounts.filter((account) => account.is_active && isIncluded(account)).map(decorate)
    if (!showInactive) return active
    return [...active, ...inactiveAccounts.filter(isIncluded).map(decorate)]
  }, [accounts, inactiveAccounts, showInactive])

  return {
    isLoading: netWorthQuery.isLoading,
    isError: netWorthQuery.isError,
    refetch: netWorthQuery.refetch,
    hasAccounts: accounts.some((account) => account.is_active),

    byCurrency,
    unknownAccounts,
    accountListEntries,

    // For NetWorthAccountList's "Show inactive accounts" transparency
    // toggle — inactive accounts are only ever displayed here, never part
    // of any asset/liability total above.
    hasInactiveAccounts: inactiveAccounts.length > 0,
    showInactive,
    setShowInactive,
  }
}

export default useActionNetWorth
