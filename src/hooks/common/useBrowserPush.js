import { useEffect, useRef } from 'react'
import { useNotificationsQuery } from '../api/useNotificationApi'
import { useNotificationPreferencesQuery } from '../api/useNotificationPreferenceApi'
import useActionAuth from '../functionality/useActionAuth'
import {
  isPushSupported,
  canShowPush,
  showBrowserNotification,
  shouldShowBrowserPush,
  markBrowserPushShown,
} from '../../utils/notifications/browserPush'

// Shows OS-level push for new unread in-app notifications (including
// daily_expense_reminder). Respects both browser permission and the
// per-domain notification_preferences toggle — a disabled domain never
// triggers a push even if the in-app notification somehow exists.
const useBrowserPush = () => {
  const { currentUser } = useActionAuth()
  const preferencesQuery = useNotificationPreferencesQuery(currentUser?.id)
  const unreadQuery = useNotificationsQuery({ isRead: false })
  const shownRef = useRef(new Set())

  useEffect(() => {
    if (!isPushSupported() || !canShowPush()) return
    if (!unreadQuery.data || !preferencesQuery.data) return

    const preferences = preferencesQuery.data
    const typeToPref = {
      daily_expense_reminder: 'daily_expenses',
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
    }

    for (const n of unreadQuery.data) {
      const prefKey = typeToPref[n.type]
      if (prefKey && preferences[prefKey] === false) continue
      const dedupe = n.dedupe_key
      if (shownRef.current.has(dedupe)) continue
      if (!shouldShowBrowserPush(dedupe)) {
        shownRef.current.add(dedupe)
        continue
      }
      shownRef.current.add(dedupe)
      markBrowserPushShown(dedupe)
      showBrowserNotification(n.title, {
        body: n.message,
        tag: dedupe,
        data: { actionPath: n.action_path },
        actionPath: n.action_path,
      })
      // Only one push per sync to avoid spamming
      break
    }
  }, [unreadQuery.data, preferencesQuery.data])
}

export default useBrowserPush
