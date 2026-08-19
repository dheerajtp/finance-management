import { useMemo, useState } from 'react'
import { useAtom } from 'jotai'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import useActionAuth from './useActionAuth'
import { useAccountsQuery } from '../api/useAccountApi'
import { useCategoriesQuery } from '../api/useCategoryApi'
import { useTransactionsQuery } from '../api/useTransactionApi'
import { useGoalsQuery } from '../api/useGoalApi'
import { useBudgetsQuery } from '../api/useBudgetApi'
import { useEmergencyFundSettingsQuery } from '../api/useEmergencyFundApi'
import { useFinancialFreedomSettingsQuery } from '../api/useFinancialFreedomApi'
import {
  useNotificationPreferencesQuery,
  useCreateNotificationPreferencesMutation,
  useUpdateNotificationPreferencesMutation,
} from '../api/useNotificationPreferenceApi'
import { useChangePasswordMutation } from '../api/useAuthApi'
import { changePasswordSchema } from '../../validations/auth/changePassword.validation'
import { themePreferenceAtom } from '../../store/theme.store'
import {
  dashboardPeriodPreferenceAtom,
  transactionDatePreferenceAtom,
  confirmDeleteTransactionAtom,
} from '../../store/preferences.store'
import { buildAccountDataExport } from '../../utils/settingsExport'
import { getAuthErrorMessage } from '../../utils/authErrors'

// Mirrors the column defaults in the 0015 migration — used before a
// preferences row exists yet (every domain on by default).
const DEFAULT_NOTIFICATION_PREFERENCES = {
  recurring_transactions: true,
  subscriptions: true,
  budgets: true,
  goals: true,
  emergency_fund: true,
  financial_freedom: true,
  investments: true,
  profile: true,
}

const downloadJson = (filename, data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// Aggregates existing domain queries/mutations for the Settings page —
// profile, notification preferences, FI/EF settings, account/auth info.
// Never calculates FI targets, emergency fund targets, or any other
// financial formula itself; every number it exposes is read as-is from the
// feature module that already owns that calculation.
const useActionSettings = () => {
  const { currentUser, profile, isLogoutConfirmOpen, requestLogout, cancelLogout, confirmLogout, loggingOut } =
    useActionAuth()
  const [isExporting, setIsExporting] = useState(false)

  const [themePreference, setThemePreference] = useAtom(themePreferenceAtom)
  const [dashboardPeriodPreference, setDashboardPeriodPreference] = useAtom(dashboardPeriodPreferenceAtom)
  const [transactionDatePreference, setTransactionDatePreference] = useAtom(transactionDatePreferenceAtom)
  const [confirmBeforeDeleteTransaction, setConfirmBeforeDeleteTransaction] = useAtom(confirmDeleteTransactionAtom)

  const accountsQuery = useAccountsQuery()
  const categoriesQuery = useCategoriesQuery({})
  const transactionsQuery = useTransactionsQuery({})
  const goalsQuery = useGoalsQuery({})
  const budgetsQuery = useBudgetsQuery({})
  const emergencyFundQuery = useEmergencyFundSettingsQuery(currentUser?.id)
  const financialFreedomQuery = useFinancialFreedomSettingsQuery(currentUser?.id)

  // Shared with the Financial Preferences summary below — same query
  // results already fetched for data export, not a second fetch.
  const accountsById = useMemo(
    () => Object.fromEntries((accountsQuery.data ?? []).map((account) => [account.id, account])),
    [accountsQuery.data],
  )

  const notificationPreferencesQuery = useNotificationPreferencesQuery(currentUser?.id)
  const createNotificationPreferencesMutation = useCreateNotificationPreferencesMutation()
  const updateNotificationPreferencesMutation = useUpdateNotificationPreferencesMutation()
  const notificationPreferences = notificationPreferencesQuery.data ?? DEFAULT_NOTIFICATION_PREFERENCES

  // Lazily creates the preferences row on its first-ever toggle (same
  // create-on-first-write pattern as emergency fund/financial freedom
  // settings) — until then, every domain reads as "on" from the defaults
  // above without needing a row to exist.
  const toggleNotificationPreference = async (key) => {
    const nextValue = !notificationPreferences[key]
    try {
      if (notificationPreferencesQuery.data) {
        await updateNotificationPreferencesMutation.mutateAsync({ [key]: nextValue })
      } else {
        await createNotificationPreferencesMutation.mutateAsync({ ...DEFAULT_NOTIFICATION_PREFERENCES, [key]: nextValue })
      }
    } catch {
      toast.error('Could not update your notification preferences. Please try again.')
    }
  }

  const changePasswordMutation = useChangePasswordMutation()
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm({ resolver: zodResolver(changePasswordSchema), defaultValues: { newPassword: '', confirmPassword: '' } })

  const submitPasswordChange = async (values) => {
    try {
      await changePasswordMutation.mutateAsync(values.newPassword)
      resetPasswordForm()
      toast.success('Password updated')
    } catch (error) {
      toast.error(getAuthErrorMessage(error))
    }
  }

  const isExportDataLoading =
    accountsQuery.isLoading ||
    categoriesQuery.isLoading ||
    transactionsQuery.isLoading ||
    goalsQuery.isLoading ||
    budgetsQuery.isLoading ||
    emergencyFundQuery.isLoading ||
    financialFreedomQuery.isLoading

  const exportData = async () => {
    setIsExporting(true)
    try {
      const payload = buildAccountDataExport({
        email: currentUser?.email ?? null,
        accounts: accountsQuery.data ?? [],
        categories: categoriesQuery.data ?? [],
        transactions: transactionsQuery.data ?? [],
        goals: goalsQuery.data ?? [],
        budgets: budgetsQuery.data ?? [],
        emergencyFundSettings: emergencyFundQuery.data ?? null,
        financialFreedomSettings: financialFreedomQuery.data ?? null,
      })
      downloadJson(`financial-freedom-os-export-${payload.exportedAt.slice(0, 10)}.json`, payload)
      toast.success('Export downloaded')
    } catch {
      toast.error('Could not prepare your export. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return {
    currentUser,
    profile,
    isLogoutConfirmOpen,
    requestLogout,
    cancelLogout,
    confirmLogout,
    loggingOut,

    themePreference,
    setThemePreference,
    dashboardPeriodPreference,
    setDashboardPeriodPreference,
    transactionDatePreference,
    setTransactionDatePreference,
    confirmBeforeDeleteTransaction,
    setConfirmBeforeDeleteTransaction,

    exportData,
    isExporting,
    isExportDataLoading,

    notificationPreferences,
    notificationPreferencesLoading: notificationPreferencesQuery.isLoading,
    toggleNotificationPreference,
    savingNotificationPreference:
      createNotificationPreferencesMutation.isPending || updateNotificationPreferencesMutation.isPending,

    accountsById,
    financialFreedomSettings: financialFreedomQuery.data ?? null,
    financialFreedomLoading: financialFreedomQuery.isLoading,
    financialFreedomError: financialFreedomQuery.isError,
    emergencyFundSettings: emergencyFundQuery.data ?? null,
    emergencyFundLoading: emergencyFundQuery.isLoading,
    emergencyFundError: emergencyFundQuery.isError,

    registerPassword,
    passwordErrors,
    submitPasswordChange: handlePasswordSubmit(submitPasswordChange),
    changingPassword: changePasswordMutation.isPending,
  }
}

export default useActionSettings
