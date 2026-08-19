import { useEffect, useRef, useState } from 'react'
import useActionAuth from './useActionAuth'
import useActionDashboardPlanning from './useActionDashboardPlanning'
import { useDashboardCommitmentsData } from '../api/useDashboardApi'
import {
  useNotificationsQuery,
  useCreateNotificationMutation,
  useDeleteExpiredNotificationsMutation,
} from '../api/useNotificationApi'
import { useNotificationPreferencesQuery } from '../api/useNotificationPreferenceApi'
import {
  detectRecurringNotifications,
  detectSubscriptionNotifications,
  detectBudgetNotifications,
  detectGoalNotifications,
  detectEmergencyFundNotifications,
  detectProfileNotifications,
  detectFinancialFreedomNotifications,
  detectInvestmentNotifications,
  detectDailyExpenseReminder,
} from '../../utils/finance/notificationRules'
import { useTransactionsQuery } from '../api/useTransactionApi'
import { formatCurrency } from '../../utils/finance/currency'

// Maps each candidate's notification `type` to the preference column that
// gates it (0015 migration) — a domain switched off simply never gets its
// candidates persisted, existing notifications are untouched.
const PREFERENCE_KEY_BY_TYPE = {
  recurring_due: 'recurring_transactions',
  recurring_overdue: 'recurring_transactions',
  subscription_upcoming: 'subscriptions',
  subscription_due: 'subscriptions',
  budget_attention: 'budgets',
  budget_over_limit: 'budgets',
  goal_milestone: 'goals',
  goal_target_reached: 'goals',
  emergency_fund_milestone: 'emergency_fund',
  emergency_fund_target_reached: 'emergency_fund',
  profile_incomplete: 'profile',
  financial_freedom_insufficient_history: 'financial_freedom',
  investment_due: 'investments',
  investment_overdue: 'investments',
  daily_expense_reminder: 'daily_expenses',
}

// Runs the deterministic rules in utils/finance/notificationRules.js against
// data every page already fetches (via useActionDashboardPlanning and the
// dashboard's commitments composer — no new Supabase access), then
// persists only the candidates that (a) aren't disabled by preference and
// (b) don't already exist. The database's unique (user_id, dedupe_key)
// index (0014) is still the final backstop; the local Set here just avoids
// firing wasted insert attempts for the common case of nothing new.
//
// Fires at most once per mount (i.e. once per authenticated session, since
// this is called from AppLayout which mounts once per login) — a ref guard
// prevents re-entry from any re-render, and nothing here runs in a timer,
// poll, or render body.
const useNotificationSync = () => {
  const { currentUser, profile } = useActionAuth()
  const planning = useActionDashboardPlanning()
  const commitments = useDashboardCommitmentsData()
  const preferencesQuery = useNotificationPreferencesQuery(currentUser?.id)
  const existingQuery = useNotificationsQuery({})
  const createMutation = useCreateNotificationMutation()
  const deleteExpiredMutation = useDeleteExpiredNotificationsMutation()
  const todayTransactionsQuery = useTransactionsQuery({
    fromDate: new Date().toISOString().slice(0, 10),
    toDate: new Date().toISOString().slice(0, 10),
  })

  const hasSyncedRef = useRef(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const dataReady =
    Boolean(currentUser) &&
    !planning.isLoading &&
    !commitments.isLoading &&
    !todayTransactionsQuery.isLoading &&
    preferencesQuery.isFetched &&
    existingQuery.isFetched

  const runSync = async () => {
    if (isSyncing) return
    setIsSyncing(true)

    try {
      // Cleanup only, not a recurring job — runs once alongside the sync,
      // never on a timer. Only ever removes notifications past their own
      // expires_at; never touches ones that haven't expired.
      await deleteExpiredMutation.mutateAsync()

      const today = new Date()
      const preferences = preferencesQuery.data
      const existingDedupeKeys = new Set((existingQuery.data ?? []).map((notification) => notification.dedupe_key))

      const candidates = [
        ...detectRecurringNotifications(commitments.recurringTransactions, today),
        ...detectSubscriptionNotifications(commitments.subscriptions, today),
        ...detectBudgetNotifications(planning.budget.attentionList, today, formatCurrency),
        ...detectGoalNotifications(planning.goals.all),
        ...detectEmergencyFundNotifications(planning.emergencyFund),
        ...detectProfileNotifications(profile, currentUser?.id),
        ...detectFinancialFreedomNotifications(planning.financialFreedom, today),
        ...detectInvestmentNotifications(commitments.investmentPlans, commitments.investmentContributions, today),
        ...detectDailyExpenseReminder(todayTransactionsQuery.data ?? [], today),
      ]

      const toCreate = candidates.filter((candidate) => {
        if (existingDedupeKeys.has(candidate.dedupeKey)) return false
        const preferenceKey = PREFERENCE_KEY_BY_TYPE[candidate.type]
        // No preferences row yet defaults to "on" for everything (matches
        // the 0015 migration's column defaults) rather than silently
        // suppressing notifications before the row is ever created.
        if (preferences && preferenceKey && preferences[preferenceKey] === false) return false
        return true
      })

      // Sequential, not Promise.all — this only ever runs once per session
      // for a handful of candidates, and sequential inserts keep a single
      // unique-violation from needing special-case handling around a
      // partial batch failure.
      for (const candidate of toCreate) {
        await createMutation.mutateAsync({
          type: candidate.type,
          title: candidate.title,
          message: candidate.message,
          severity: candidate.severity,
          entity_type: candidate.entityType ?? null,
          entity_id: candidate.entityId ?? null,
          action_path: candidate.actionPath ?? null,
          dedupe_key: candidate.dedupeKey,
          expires_at: candidate.expiresAt ?? null,
        })
      }
    } catch {
      // Notification sync must never break the app it's running inside —
      // silently give up this run; the next session's sync will retry the
      // same (still-pure, still-deterministic) candidates.
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    if (hasSyncedRef.current || !dataReady) return
    hasSyncedRef.current = true
    runSync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataReady])

  return { isSyncing, resync: runSync }
}

export default useNotificationSync
