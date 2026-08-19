import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import useActionAuth from './useActionAuth'
import { useAccountsQuery } from '../api/useAccountApi'
import { useCategoriesQuery } from '../api/useCategoryApi'
import { useTransactionsQuery } from '../api/useTransactionApi'
import {
  useEmergencyFundSettingsQuery,
  useCreateEmergencyFundSettingsMutation,
  useUpdateEmergencyFundSettingsMutation,
} from '../api/useEmergencyFundApi'
import { emergencyFundSchema } from '../../validations/emergencyFund/emergencyFund.validation'
import {
  calculateEssentialMonthlyAverage,
  calculateEmergencyFundTarget,
  calculateEmergencyFundProgress,
  calculateEmergencyFundRemaining,
  calculateContributionMonths,
  calculateEstimatedCompletionDate,
  getEmergencyFundStatus,
} from '../../utils/finance/emergencyFund'
import { calculateNextMilestone } from '../../utils/finance/emergencyFundMilestones'
import { getLastNMonthsRange } from '../../utils/finance/dateRange'
import {
  DEFAULT_EMERGENCY_FUND_TARGET_MONTHS,
  ESSENTIAL_EXPENSE_BASELINE_MONTHS,
  EMERGENCY_FUND_ELIGIBLE_ACCOUNT_TYPES,
} from '../../constants/emergencyFund'

const CHECK_VIOLATION = '23514'
const KNOWN_MESSAGES = [
  'Emergency fund account not found',
  'Emergency fund account must be active',
  'Emergency fund account must be a bank or cash account',
  'Emergency fund account must use your profile currency',
]

const toFriendlyMessage = (error) => {
  if (KNOWN_MESSAGES.some((message) => error?.message?.includes(message))) return error.message
  if (error?.code === CHECK_VIOLATION) return 'Please check the values you entered.'
  return 'Could not save your emergency fund settings. Please try again.'
}

const emptyValues = { target_months: DEFAULT_EMERGENCY_FUND_TARGET_MONTHS, monthly_contribution: '', emergency_account_id: '' }

const useActionEmergencyFund = () => {
  const { currentUser, profile } = useActionAuth()

  const settingsQuery = useEmergencyFundSettingsQuery(currentUser?.id)
  const accountsQuery = useAccountsQuery()
  const categoriesQuery = useCategoriesQuery({})
  const dateRange = getLastNMonthsRange(ESSENTIAL_EXPENSE_BASELINE_MONTHS + 1)
  const transactionsQuery = useTransactionsQuery({ type: 'expense', fromDate: dateRange.start, toDate: dateRange.end })

  const createMutation = useCreateEmergencyFundSettingsMutation()
  const updateMutation = useUpdateEmergencyFundSettingsMutation()

  const settings = settingsQuery.data ?? null
  const accounts = accountsQuery.data ?? []
  const transactions = transactionsQuery.data ?? []

  const categoriesById = useMemo(
    () => Object.fromEntries((categoriesQuery.data ?? []).map((category) => [category.id, category])),
    [categoriesQuery.data],
  )

  const eligibleAccounts = useMemo(
    () =>
      (accountsQuery.data ?? []).filter(
        (account) =>
          account.is_active &&
          EMERGENCY_FUND_ELIGIBLE_ACCOUNT_TYPES.includes(account.type) &&
          account.currency === profile?.currency,
      ),
    [accountsQuery.data, profile],
  )
  const accountOptions = eligibleAccounts.map((account) => ({
    value: account.id,
    label: `${account.name} (${account.currency})`,
  }))

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(emergencyFundSchema), defaultValues: emptyValues })

  useEffect(() => {
    if (!settings) return
    reset({
      target_months: settings.target_months,
      monthly_contribution: settings.monthly_contribution ?? '',
      emergency_account_id: settings.emergency_account_id ?? '',
    })
  }, [settings, reset])

  const onSubmit = async (values) => {
    try {
      if (settings) {
        await updateMutation.mutateAsync(values)
      } else {
        await createMutation.mutateAsync(values)
      }
      toast.success('Emergency fund settings saved')
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  const selectedAccount = settings?.emergency_account_id
    ? accounts.find((account) => account.id === settings.emergency_account_id)
    : null

  // Never silently fall back to another account — surface the problem instead.
  const accountIssue = !settings?.emergency_account_id
    ? null
    : !selectedAccount
      ? 'Your emergency fund account is no longer available. Please select another.'
      : !selectedAccount.is_active
        ? 'Your emergency fund account is now inactive. Please select another.'
        : !EMERGENCY_FUND_ELIGIBLE_ACCOUNT_TYPES.includes(selectedAccount.type)
          ? 'Your emergency fund account is no longer a bank or cash account. Please select another.'
          : selectedAccount.currency !== profile?.currency
            ? "Your emergency fund account's currency no longer matches your profile currency. Please select another."
            : null

  const currency = profile?.currency ?? null
  const baseline = calculateEssentialMonthlyAverage(transactions, categoriesById, ESSENTIAL_EXPENSE_BASELINE_MONTHS)
  const targetMonths = settings?.target_months ?? DEFAULT_EMERGENCY_FUND_TARGET_MONTHS
  const target = calculateEmergencyFundTarget(baseline.average, targetMonths)
  const current = accountIssue ? null : (selectedAccount?.balance ?? null)
  const progress = current !== null ? calculateEmergencyFundProgress(current, target) : null
  const remaining = current !== null ? calculateEmergencyFundRemaining(current, target) : null
  const amountAboveTarget = current !== null && target !== null ? Math.max(0, current - target) : 0
  const contributionMonths = calculateContributionMonths(remaining, settings?.monthly_contribution)
  const estimatedCompletionDate = calculateEstimatedCompletionDate(contributionMonths)
  const nextMilestone = progress !== null ? calculateNextMilestone(progress, target) : null

  const status = getEmergencyFundStatus({
    monthsUsed: baseline.monthsUsed,
    requiredMonths: ESSENTIAL_EXPENSE_BASELINE_MONTHS,
    hasCurrentBalance: current !== null,
    progress: progress ?? 0,
  })

  const isLoading =
    settingsQuery.isLoading || accountsQuery.isLoading || categoriesQuery.isLoading || transactionsQuery.isLoading
  const isError =
    settingsQuery.isError || accountsQuery.isError || categoriesQuery.isError || transactionsQuery.isError

  return {
    hasProfileCurrency: Boolean(currency),
    currency,
    isLoading,
    isError,
    refetch: () => {
      settingsQuery.refetch()
      accountsQuery.refetch()
      categoriesQuery.refetch()
      transactionsQuery.refetch()
    },

    register,
    onSubmit: handleSubmit(onSubmit),
    errors,
    saving: createMutation.isPending || updateMutation.isPending,
    accountOptions,
    hasEligibleAccounts: eligibleAccounts.length > 0,

    settings,
    selectedAccount,
    accountIssue,

    baseline,
    target,
    current,
    progress,
    remaining,
    amountAboveTarget,
    contributionMonths,
    estimatedCompletionDate,
    nextMilestone,
    status,
  }
}

export default useActionEmergencyFund
