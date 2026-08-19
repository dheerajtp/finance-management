import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as categoryService from '../../services/supabase/category.service'

export const categoryKeys = {
  list: (filters = {}) => ['categories', filters],
  detail: (id) => ['category', id],
}

export const useCategoriesQuery = (filters = {}) =>
  useQuery({
    queryKey: categoryKeys.list(filters),
    queryFn: () => categoryService.getCategories(filters),
  })

export const useCategoryQuery = (id) =>
  useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => categoryService.getCategory(id),
    enabled: Boolean(id),
  })

const useInvalidateCategories = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['categories'] })
}

export const useCreateCategoryMutation = () => {
  const invalidate = useInvalidateCategories()
  return useMutation({ mutationFn: categoryService.createCategory, onSuccess: invalidate })
}

export const useUpdateCategoryMutation = () => {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: ({ id, data }) => categoryService.updateCategory(id, data),
    onSuccess: invalidate,
  })
}

export const useDeactivateCategoryMutation = () => {
  const invalidate = useInvalidateCategories()
  return useMutation({ mutationFn: categoryService.deactivateCategory, onSuccess: invalidate })
}

export const useActivateCategoryMutation = () => {
  const invalidate = useInvalidateCategories()
  return useMutation({ mutationFn: categoryService.activateCategory, onSuccess: invalidate })
}

export const useInitializeDefaultCategoriesMutation = () => {
  const invalidate = useInvalidateCategories()
  return useMutation({ mutationFn: categoryService.initializeDefaultCategories, onSuccess: invalidate })
}
