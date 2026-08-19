import { useAccountsQuery } from './useAccountApi'

// Net worth has no Supabase table of its own — it's entirely derived from
// accounts, so this hook only ever composes the existing account query
// (same cache entry as every other accounts.* consumer, no duplicate
// fetch) rather than adding a second data source.
export const useNetWorthQuery = () => useAccountsQuery()
