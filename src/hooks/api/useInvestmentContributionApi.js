import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as investmentContributionService from '../../services/supabase/investmentContribution.service'

export const investmentContributionKeys = {
  list: (filters = {}) => ['investment-contributions', filters],
  detail: (id) => ['investment-contribution', id],
}

export const useInvestmentContributionsQuery = (filters = {}) =>
  useQuery({
    queryKey: investmentContributionKeys.list(filters),
    queryFn: () => investmentContributionService.getContributions(filters),
  })

export const useInvestmentContributionQuery = (id) =>
  useQuery({
    queryKey: investmentContributionKeys.detail(id),
    queryFn: () => investmentContributionService.getContribution(id),
    enabled: Boolean(id),
  })

// A contribution mutation can change what a plan's card shows (its current
// occurrence's fulfilled/due/overdue status derives from contributions —
// see calculateContributionStatus), so plans are invalidated alongside
// contributions; holdings are deliberately NOT invalidated here — recording
// a contribution never touches invested_amount/current_value (see task
// notes / investmentHolding.service.js).
const useInvalidateInvestmentContributions = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['investment-contributions'] })
    queryClient.invalidateQueries({ queryKey: ['investment-plans'] })
  }
}

export const useCreateInvestmentContributionMutation = () => {
  const invalidate = useInvalidateInvestmentContributions()
  return useMutation({ mutationFn: investmentContributionService.createContribution, onSuccess: invalidate })
}

export const useUpdateInvestmentContributionMutation = () => {
  const invalidate = useInvalidateInvestmentContributions()
  return useMutation({
    mutationFn: ({ id, data }) => investmentContributionService.updateContribution(id, data),
    onSuccess: invalidate,
  })
}

export const useDeleteInvestmentContributionMutation = () => {
  const invalidate = useInvalidateInvestmentContributions()
  return useMutation({ mutationFn: investmentContributionService.deleteContribution, onSuccess: invalidate })
}
