import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as accountService from '../../services/supabase/account.service'

export const accountKeys = {
  list: ['accounts'],
  detail: (id) => ['account', id],
}

export const useAccountsQuery = () =>
  useQuery({
    queryKey: accountKeys.list,
    queryFn: accountService.getAccounts,
  })

export const useAccountQuery = (id) =>
  useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: () => accountService.getAccount(id),
    enabled: Boolean(id),
  })

const useInvalidateAccounts = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: accountKeys.list })
}

export const useCreateAccountMutation = () => {
  const invalidate = useInvalidateAccounts()
  return useMutation({
    mutationFn: accountService.createAccount,
    onSuccess: invalidate,
  })
}

export const useUpdateAccountMutation = () => {
  const invalidate = useInvalidateAccounts()
  return useMutation({
    mutationFn: ({ id, data }) => accountService.updateAccount(id, data),
    onSuccess: invalidate,
  })
}

export const useDeactivateAccountMutation = () => {
  const invalidate = useInvalidateAccounts()
  return useMutation({
    mutationFn: accountService.deactivateAccount,
    onSuccess: invalidate,
  })
}

export const useActivateAccountMutation = () => {
  const invalidate = useInvalidateAccounts()
  return useMutation({
    mutationFn: accountService.activateAccount,
    onSuccess: invalidate,
  })
}
