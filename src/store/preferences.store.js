import { atomWithStorage } from 'jotai/utils'
import { DEFAULT_DASHBOARD_PERIOD } from '../constants/dashboard'

// Local, per-browser application preferences (Settings page). Not synced
// across devices — genuinely local UI/behavior defaults, not financial data.
export const dashboardPeriodPreferenceAtom = atomWithStorage('ffos:pref:dashboard_period', DEFAULT_DASHBOARD_PERIOD)

// 'today' pre-fills the transaction date field with today's date; 'manual'
// leaves it blank so the user must pick a date deliberately.
export const transactionDatePreferenceAtom = atomWithStorage('ffos:pref:transaction_date', 'today')

export const confirmDeleteTransactionAtom = atomWithStorage('ffos:pref:confirm_delete_transaction', true)
