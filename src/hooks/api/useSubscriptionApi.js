import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as subscriptionService from '../../services/supabase/subscription.service'

export const subscriptionKeys = {
  list: (filters = {}) => ['subscriptions', filters],
  detail: (id) => ['subscription', id],
}

export const useSubscriptionsQuery = (filters = {}) =>
  useQuery({
    queryKey: subscriptionKeys.list(filters),
    queryFn: () => subscriptionService.getSubscriptions(filters),
  })

export const useSubscriptionQuery = (id) =>
  useQuery({
    queryKey: subscriptionKeys.detail(id),
    queryFn: () => subscriptionService.getSubscription(id),
    enabled: Boolean(id),
  })

const useInvalidateSubscriptions = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
}

export const useCreateSubscriptionMutation = () => {
  const invalidate = useInvalidateSubscriptions()
  return useMutation({ mutationFn: subscriptionService.createSubscription, onSuccess: invalidate })
}

export const useUpdateSubscriptionMutation = () => {
  const invalidate = useInvalidateSubscriptions()
  return useMutation({
    mutationFn: ({ id, data }) => subscriptionService.updateSubscription(id, data),
    onSuccess: invalidate,
  })
}

export const useDeactivateSubscriptionMutation = () => {
  const invalidate = useInvalidateSubscriptions()
  return useMutation({ mutationFn: subscriptionService.deactivateSubscription, onSuccess: invalidate })
}

export const useActivateSubscriptionMutation = () => {
  const invalidate = useInvalidateSubscriptions()
  return useMutation({ mutationFn: subscriptionService.activateSubscription, onSuccess: invalidate })
}
