import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as investmentHoldingService from '../../services/supabase/investmentHolding.service'

export const investmentHoldingKeys = {
  list: (filters = {}) => ['investment-holdings', filters],
  detail: (id) => ['investment-holding', id],
}

export const useInvestmentHoldingsQuery = (filters = {}) =>
  useQuery({
    queryKey: investmentHoldingKeys.list(filters),
    queryFn: () => investmentHoldingService.getHoldings(filters),
  })

export const useInvestmentHoldingQuery = (id) =>
  useQuery({
    queryKey: investmentHoldingKeys.detail(id),
    queryFn: () => investmentHoldingService.getHolding(id),
    enabled: Boolean(id),
  })

const useInvalidateInvestmentHoldings = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['investment-holdings'] })
}

export const useCreateInvestmentHoldingMutation = () => {
  const invalidate = useInvalidateInvestmentHoldings()
  return useMutation({ mutationFn: investmentHoldingService.createHolding, onSuccess: invalidate })
}

export const useUpdateInvestmentHoldingMutation = () => {
  const invalidate = useInvalidateInvestmentHoldings()
  return useMutation({
    mutationFn: ({ id, data }) => investmentHoldingService.updateHolding(id, data),
    onSuccess: invalidate,
  })
}

export const useDeactivateInvestmentHoldingMutation = () => {
  const invalidate = useInvalidateInvestmentHoldings()
  return useMutation({ mutationFn: investmentHoldingService.deactivateHolding, onSuccess: invalidate })
}

export const useActivateInvestmentHoldingMutation = () => {
  const invalidate = useInvalidateInvestmentHoldings()
  return useMutation({ mutationFn: investmentHoldingService.activateHolding, onSuccess: invalidate })
}
