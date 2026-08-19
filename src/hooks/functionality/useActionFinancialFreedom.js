import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import useActionAuth from './useActionAuth'
import { useAccountsQuery } from '../api/useAccountApi'
import { useCategoriesQuery } from '../api/useCategoryApi'
import { useTransactionsQuery } from '../api/useTransactionApi'
import {
  useFinancialFreedomSettingsQuery,
  useCreateFinancialFreedomSettingsMutation,
  useUpdateFinancialFreedomSettingsMutation,
} from '../api/useFinancialFreedomApi'
import { financialFreedomSettingsSchema } from '../../validations/financialFreedom/financialFreedom.validation'
import { getCurrentMonthRange, getLastNMonthsRange } from '../../utils/finance/dateRange'
import { groupTransactionsByCurrency } from '../../utils/finance/transactionSummary'
import { calculateMonthlyMetrics } from '../../utils/finance/dashboardMetrics'
import {
  calculateAverageMonthlySpending,
  calculateEstimatedAnnualSpending,
  calculateFITarget,
  calculateFIProgress,
  calculateFIGap,
  calculateProjection,
  calculateScenarioProjection,
  calculateDiscretionaryReductionScenario,
  getFinancialFreedomInsights,
} from '../../utils/finance/financialFreedom'
import { formatCurrency } from '../../utils/finance/currency'
import {
  DEFAULT_FI_MULTIPLIER,
  DEFAULT_FI_ANALYSIS_MONTHS,
  DEFAULT_FI_EXPECTED_RETURN,
  FI_ELIGIBLE_ACCOUNT_TYPES,
  FI_SCENARIO_MULTIPLIERS,
  FI_DISCRETIONARY_REDUCTION_OPTIONS,
} from '../../constants/financialFreedom'

const CHECK_VIOLATION = '23514'
const KNOWN_MESSAGE = 'Selected financial independence accounts must belong to you and be a bank, cash, or investment account'

const toFriendlyMessage = (error) => {
  if (error?.message?.includes(KNOWN_MESSAGE)) return error.message
  if (error?.code === CHECK_VIOLATION) return 'Please check the values you entered.'
  return 'Could not save your financial freedom settings. Please try again.'
}

const emptyValues = {
  analysis_months: DEFAULT_FI_ANALYSIS_MONTHS,
  fi_multiplier: DEFAULT_FI_MULTIPLIER,
  expected_annual_return: DEFAULT_FI_EXPECTED_RETURN,
  monthly_contribution: '',
}

const useActionFinancialFreedom = () => {
  const { currentUser, profile } = useActionAuth()
  const currency = profile?.currency ?? null

  const settingsQuery = useFinancialFreedomSettingsQuery(currentUser?.id)
  const accountsQuery = useAccountsQuery()
  const categoriesQuery = useCategoriesQuery({})

  const settings = settingsQuery.data ?? null
  const analysisMonths = settings?.analysis_months ?? DEFAULT_FI_ANALYSIS_MONTHS
  const fiMultiplier = settings?.fi_multiplier ?? DEFAULT_FI_MULTIPLIER
  const expectedAnnualReturn = settings?.expected_annual_return ?? DEFAULT_FI_EXPECTED_RETURN

  const spendingRange = getLastNMonthsRange(analysisMonths + 1)
  const spendingTransactionsQuery = useTransactionsQuery({
    type: 'expense',
    fromDate: spendingRange.start,
    toDate: spendingRange.end,
  })

  const currentMonthRange = getCurrentMonthRange()
  const currentMonthTransactionsQuery = useTransactionsQuery({
    fromDate: currentMonthRange.start,
    toDate: currentMonthRange.end,
  })

  const createMutation = useCreateFinancialFreedomSettingsMutation()
  const updateMutation = useUpdateFinancialFreedomSettingsMutation()

  const accounts = accountsQuery.data ?? []
  const accountsById = useMemo(
    () => Object.fromEntries((accountsQuery.data ?? []).map((account) => [account.id, account])),
    [accountsQuery.data],
  )
  const categoriesById = useMemo(
    () => Object.fromEntries((categoriesQuery.data ?? []).map((category) => [category.id, category])),
    [categoriesQuery.data],
  )

  const [selectedAccountIds, setSelectedAccountIds] = useState([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(financialFreedomSettingsSchema), defaultValues: emptyValues })

  useEffect(() => {
    if (!settings) return
    reset({
      analysis_months: settings.analysis_months,
      fi_multiplier: settings.fi_multiplier,
      expected_annual_return: settings.expected_annual_return,
      monthly_contribution: settings.monthly_contribution ?? '',
    })
    setSelectedAccountIds(settings.selected_account_ids ?? [])
  }, [settings, reset])

  const toggleAccount = (accountId) => {
    setSelectedAccountIds((current) =>
      current.includes(accountId) ? current.filter((id) => id !== accountId) : [...current, accountId],
    )
  }

  const onSubmit = async (values) => {
    const payload = { ...values, selected_account_ids: selectedAccountIds }
    try {
      if (settings) await updateMutation.mutateAsync(payload)
      else await createMutation.mutateAsync(payload)
      toast.success('Financial freedom settings saved')
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  const eligibleAccounts = accounts.filter(
    (account) => account.is_active && FI_ELIGIBLE_ACCOUNT_TYPES.includes(account.type),
  )
  const selectedAccounts = eligibleAccounts.filter((account) => selectedAccountIds.includes(account.id))
  const selectedAccountsInCurrency = selectedAccounts.filter((account) => account.currency === currency)
  const hasOtherCurrencyAccountsSelected = selectedAccounts.length > selectedAccountsInCurrency.length
  const currentFIAssets = selectedAccountsInCurrency.reduce((sum, account) => sum + (Number(account.balance) || 0), 0)

  const spendingTransactions = spendingTransactionsQuery.data ?? []
  const spendingGroups = groupTransactionsByCurrency(spendingTransactions, accountsById)
  const spendingInCurrency = currency ? (spendingGroups.get(currency) ?? []) : []
  const hasOtherCurrencyTransactions = Array.from(spendingGroups.keys()).some((groupCurrency) => groupCurrency !== currency)

  const spending = calculateAverageMonthlySpending(spendingInCurrency, categoriesById, analysisMonths)
  const estimatedAnnualSpending = calculateEstimatedAnnualSpending(spending.average)
  const fiTarget = calculateFITarget(estimatedAnnualSpending, fiMultiplier)
  const fiProgress = currency ? calculateFIProgress(currentFIAssets, fiTarget) : null
  const fiGap = calculateFIGap(fiTarget, currentFIAssets)

  // Savings rate / current monthly savings — current month, same currency,
  // reusing Task 08's dashboard calculation rather than re-deriving it.
  const currentMonthTransactions = currentMonthTransactionsQuery.data ?? []
  const currentMonthGroups = groupTransactionsByCurrency(currentMonthTransactions, accountsById)
  const currentMonthInCurrency = currency ? (currentMonthGroups.get(currency) ?? []) : []
  const monthlyMetrics = calculateMonthlyMetrics(currentMonthInCurrency)

  const monthlyContribution =
    settings?.monthly_contribution !== null && settings?.monthly_contribution !== undefined
      ? settings.monthly_contribution
      : monthlyMetrics.savings

  const projection = calculateProjection(currentFIAssets, monthlyContribution, expectedAnnualReturn, fiTarget)

  const scenarios = FI_SCENARIO_MULTIPLIERS.map((multiplier) => ({
    multiplier,
    monthlyContribution: Math.max(0, monthlyContribution) * multiplier,
    projection: calculateScenarioProjection(currentFIAssets, monthlyContribution, multiplier, expectedAnnualReturn, fiTarget),
  }))

  const discretionaryScenarios = FI_DISCRETIONARY_REDUCTION_OPTIONS.map((reductionPercent) => {
    const { savingsImprovement, scenarioContribution } = calculateDiscretionaryReductionScenario(
      spending.discretionaryAverage,
      reductionPercent,
      monthlyContribution,
    )
    return {
      reductionPercent,
      savingsImprovement,
      scenarioContribution,
      projection: calculateProjection(currentFIAssets, scenarioContribution, expectedAnnualReturn, fiTarget),
    }
  })

  const insights = getFinancialFreedomInsights(
    { savingsRate: monthlyMetrics.savingsRate, discretionaryAverage: spending.discretionaryAverage ?? 0, fiProgress, currency },
    formatCurrency,
  )

  const isLoading =
    settingsQuery.isLoading ||
    accountsQuery.isLoading ||
    categoriesQuery.isLoading ||
    spendingTransactionsQuery.isLoading ||
    currentMonthTransactionsQuery.isLoading
  const isError =
    settingsQuery.isError ||
    accountsQuery.isError ||
    categoriesQuery.isError ||
    spendingTransactionsQuery.isError ||
    currentMonthTransactionsQuery.isError

  return {
    hasProfileCurrency: Boolean(currency),
    currency,
    isLoading,
    isError,
    refetch: () => {
      settingsQuery.refetch()
      accountsQuery.refetch()
      categoriesQuery.refetch()
      spendingTransactionsQuery.refetch()
      currentMonthTransactionsQuery.refetch()
    },

    register,
    onSubmit: handleSubmit(onSubmit),
    errors,
    saving: createMutation.isPending || updateMutation.isPending,
    eligibleAccounts,
    selectedAccountIds,
    toggleAccount,

    analysisMonths,
    fiMultiplier,
    expectedAnnualReturn,
    monthlyContribution,

    spending,
    estimatedAnnualSpending,
    fiTarget,
    currentFIAssets,
    fiProgress,
    fiGap,
    monthlyMetrics,
    projection,
    scenarios,
    discretionaryScenarios,
    insights,

    hasSufficientHistory: spending.monthsUsed > 0,
    hasSelectedAccounts: selectedAccountsInCurrency.length > 0,
    hasOtherCurrencyAccountsSelected,
    hasOtherCurrencyTransactions,
  }
}

export default useActionFinancialFreedom
