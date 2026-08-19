import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import {
  useInvestmentHoldingsQuery,
  useCreateInvestmentHoldingMutation,
  useUpdateInvestmentHoldingMutation,
  useDeactivateInvestmentHoldingMutation,
  useActivateInvestmentHoldingMutation,
} from '../api/useInvestmentHoldingApi'
import { useInvestmentPlansQuery } from '../api/useInvestmentPlanApi'
import { useInvestmentContributionsQuery } from '../api/useInvestmentContributionApi'
import { useAccountsQuery } from '../api/useAccountApi'
import { useTransactionsQuery } from '../api/useTransactionApi'
import { investmentHoldingSchema } from '../../validations/investments/investmentHolding.validation'
import { decorateHoldings, buildInvestmentOverviewByCurrency } from '../../utils/finance/investments'
import { getCurrentMonthRange } from '../../utils/finance/dateRange'
import { DEFAULT_CURRENCY } from '../../constants/currencies'

const CHECK_VIOLATION = '23514'

// Messages validate_investment_holding() (0016 migration) is known to raise — safe to show verbatim.
const KNOWN_MESSAGES = [
  'Account not found',
  'Investment holdings can only be linked to an investment account',
  'Cannot create an investment holding on an inactive account',
]

const toFriendlyMessage = (error) => {
  if (KNOWN_MESSAGES.some((message) => error?.message?.includes(message))) return error.message
  if (error?.code === CHECK_VIOLATION) return 'Please check the values you entered.'
  return 'Unable to save investment. Please try again.'
}

const SORTERS = {
  current_value: (a, b) => b.current_value - a.current_value,
  gain: (a, b) => b.gain - a.gain,
  name: (a, b) => a.name.localeCompare(b.name),
  invested_amount: (a, b) => b.invested_amount - a.invested_amount,
}

const emptyValues = {
  name: '',
  type: 'mutual_fund',
  account_id: '',
  currency: DEFAULT_CURRENCY,
  invested_amount: '',
  current_value: '',
}

// Owns holdings (list/filter/CRUD) and the currency-grouped overview —
// SIP/plan management lives in useActionInvestmentPlan and recording a
// contribution lives in useActionInvestmentContribution, so this file
// stays focused (same three-hook split as Task 16's recurring
// transactions). Every gain/allocation/rate number reuses
// utils/finance/investments.js — nothing is recalculated inline.
const useActionInvestments = () => {
  const [currencyFilter, setCurrencyFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showInactive, setShowInactive] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('current_value')

  const holdingsQuery = useInvestmentHoldingsQuery(showInactive ? {} : { isActive: true })
  const accountsQuery = useAccountsQuery()
  const plansQuery = useInvestmentPlansQuery({ isActive: true })
  const contributionsQuery = useInvestmentContributionsQuery({})

  const monthRange = getCurrentMonthRange()
  const monthlyIncomeQuery = useTransactionsQuery({ type: 'income', fromDate: monthRange.start, toDate: monthRange.end })

  const createMutation = useCreateInvestmentHoldingMutation()
  const updateMutation = useUpdateInvestmentHoldingMutation()
  const deactivateMutation = useDeactivateInvestmentHoldingMutation()
  const activateMutation = useActivateInvestmentHoldingMutation()

  const [editingHolding, setEditingHolding] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingToggle, setPendingToggle] = useState(null)
  const [manageSipHolding, setManageSipHolding] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(investmentHoldingSchema), defaultValues: emptyValues })

  const accountsById = useMemo(
    () => Object.fromEntries((accountsQuery.data ?? []).map((account) => [account.id, account])),
    [accountsQuery.data],
  )
  const investmentAccountOptions = (accountsQuery.data ?? [])
    .filter((account) => account.is_active && account.type === 'investment')
    .map((account) => ({ value: account.id, label: `${account.name} (${account.currency})` }))

  const decoratedHoldings = useMemo(
    () => decorateHoldings(holdingsQuery.data ?? [], accountsById, plansQuery.data ?? []),
    [holdingsQuery.data, accountsById, plansQuery.data],
  )

  const filteredHoldings = decoratedHoldings
    .filter((holding) => {
      if (currencyFilter !== 'all' && holding.currency !== currencyFilter) return false
      if (typeFilter !== 'all' && holding.type !== typeFilter) return false
      if (search.trim() && !holding.name.toLowerCase().includes(search.trim().toLowerCase())) return false
      return true
    })
    .sort(SORTERS[sortBy] ?? SORTERS.current_value)

  const currencyOptions = Array.from(new Set(decoratedHoldings.map((holding) => holding.currency))).map((currency) => ({
    value: currency,
    label: currency,
  }))

  // One overview group per currency — never combined, matching every other
  // multi-currency section in this app. Grouping/summing logic itself lives
  // in utils/finance/investments.js (buildInvestmentOverviewByCurrency).
  const overviewByCurrency = useMemo(
    () =>
      buildInvestmentOverviewByCurrency({
        holdings: decoratedHoldings.filter((holding) => holding.is_active),
        plans: plansQuery.data ?? [],
        contributions: contributionsQuery.data ?? [],
        monthlyIncomeTransactions: monthlyIncomeQuery.data ?? [],
        accountsById,
        monthRange,
      }),
    [decoratedHoldings, plansQuery.data, contributionsQuery.data, monthlyIncomeQuery.data, accountsById, monthRange],
  )

  const openCreateForm = () => {
    setEditingHolding(null)
    reset(emptyValues)
    setIsFormOpen(true)
  }

  const openEditForm = (holding) => {
    setEditingHolding(holding)
    reset({
      name: holding.name,
      type: holding.type,
      account_id: holding.account_id,
      currency: holding.currency,
      invested_amount: holding.invested_amount,
      current_value: holding.current_value,
    })
    setIsFormOpen(true)
  }

  const closeForm = () => setIsFormOpen(false)

  const onSubmit = async (values) => {
    const payload = {
      name: values.name,
      type: values.type,
      account_id: values.account_id,
      currency: values.currency,
      invested_amount: values.invested_amount,
      current_value: values.current_value,
    }

    try {
      if (editingHolding) {
        await updateMutation.mutateAsync({ id: editingHolding.id, data: payload })
        toast.success('Investment updated')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Investment added')
      }
      setIsFormOpen(false)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  const requestToggleActive = (holding) => setPendingToggle(holding)
  const cancelToggleActive = () => setPendingToggle(null)

  const requestManageSip = (holding) => setManageSipHolding(holding)
  const closeManageSip = () => setManageSipHolding(null)

  const confirmToggleActive = async () => {
    if (!pendingToggle) return
    try {
      if (pendingToggle.is_active) {
        await deactivateMutation.mutateAsync(pendingToggle.id)
        toast.success('Investment deactivated')
      } else {
        await activateMutation.mutateAsync(pendingToggle.id)
        toast.success('Investment activated')
      }
      setPendingToggle(null)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  return {
    holdings: filteredHoldings,
    allHoldings: decoratedHoldings,
    overviewByCurrency,
    isLoading: holdingsQuery.isLoading || accountsQuery.isLoading || plansQuery.isLoading,
    isError: holdingsQuery.isError || accountsQuery.isError,
    refetch: () => {
      holdingsQuery.refetch()
      accountsQuery.refetch()
      plansQuery.refetch()
    },

    currencyFilter,
    setCurrencyFilter,
    currencyOptions,
    typeFilter,
    setTypeFilter,
    showInactive,
    setShowInactive,
    search,
    setSearch,
    sortBy,
    setSortBy,

    isFormOpen,
    isEditing: Boolean(editingHolding),
    openCreateForm,
    openEditForm,
    closeForm,
    register,
    errors,
    investmentAccountOptions,
    onSubmit: handleSubmit(onSubmit),
    saving: createMutation.isPending || updateMutation.isPending,

    pendingToggle,
    requestToggleActive,
    cancelToggleActive,
    confirmToggleActive,
    togglingActive: deactivateMutation.isPending || activateMutation.isPending,

    manageSipHolding,
    requestManageSip,
    closeManageSip,
  }
}

export default useActionInvestments
