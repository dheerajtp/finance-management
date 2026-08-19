import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as investmentPlanService from '../../services/supabase/investmentPlan.service'

export const investmentPlanKeys = {
  list: (filters = {}) => ['investment-plans', filters],
  detail: (id) => ['investment-plan', id],
}

export const useInvestmentPlansQuery = (filters = {}) =>
  useQuery({
    queryKey: investmentPlanKeys.list(filters),
    queryFn: () => investmentPlanService.getPlans(filters),
  })

export const useInvestmentPlanQuery = (id) =>
  useQuery({
    queryKey: investmentPlanKeys.detail(id),
    queryFn: () => investmentPlanService.getPlan(id),
    enabled: Boolean(id),
  })

const useInvalidateInvestmentPlans = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['investment-plans'] })
}

export const useCreateInvestmentPlanMutation = () => {
  const invalidate = useInvalidateInvestmentPlans()
  return useMutation({ mutationFn: investmentPlanService.createPlan, onSuccess: invalidate })
}

export const useUpdateInvestmentPlanMutation = () => {
  const invalidate = useInvalidateInvestmentPlans()
  return useMutation({
    mutationFn: ({ id, data }) => investmentPlanService.updatePlan(id, data),
    onSuccess: invalidate,
  })
}

export const usePauseInvestmentPlanMutation = () => {
  const invalidate = useInvalidateInvestmentPlans()
  return useMutation({ mutationFn: investmentPlanService.pausePlan, onSuccess: invalidate })
}

export const useResumeInvestmentPlanMutation = () => {
  const invalidate = useInvalidateInvestmentPlans()
  return useMutation({ mutationFn: investmentPlanService.resumePlan, onSuccess: invalidate })
}

export const useEndInvestmentPlanMutation = () => {
  const invalidate = useInvalidateInvestmentPlans()
  return useMutation({ mutationFn: investmentPlanService.endPlan, onSuccess: invalidate })
}
