import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeactivateCategoryMutation,
  useActivateCategoryMutation,
  useInitializeDefaultCategoriesMutation,
} from '../api/useCategoryApi'
import { categorySchema } from '../../validations/categories/category.validation'

const CHECK_VIOLATION = '23514'
const UNIQUE_VIOLATION = '23505'

const toFriendlyMessage = (error) => {
  if (error?.code === UNIQUE_VIOLATION) return 'A category with that name and type already exists.'
  if (error?.code === CHECK_VIOLATION) return 'Please check the values you entered.'
  return 'Could not save the category. Please try again.'
}

const emptyValues = { name: '', type: 'expense', is_essential: false }

const useActionCategory = () => {
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')
  const [hasAttemptedInit, setHasAttemptedInit] = useState(false)

  const queryFilters = {
    ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
    ...(statusFilter !== 'all' ? { isActive: statusFilter === 'active' } : {}),
  }

  const categoriesQuery = useCategoriesQuery(queryFilters)
  const createMutation = useCreateCategoryMutation()
  const updateMutation = useUpdateCategoryMutation()
  const deactivateMutation = useDeactivateCategoryMutation()
  const activateMutation = useActivateCategoryMutation()
  const initializeMutation = useInitializeDefaultCategoriesMutation()

  const [editingCategory, setEditingCategory] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingToggle, setPendingToggle] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(categorySchema), defaultValues: emptyValues })

  const watchedType = watch('type')

  useEffect(() => {
    if (watchedType === 'income') setValue('is_essential', false)
  }, [watchedType, setValue])

  // First visit to Categories (default filters, nothing loaded yet): seed
  // this user's defaults. Idempotent via the DB's unique constraint + ON
  // CONFLICT, so this is safe even if it fires more than once.
  useEffect(() => {
    if (hasAttemptedInit) return
    if (categoriesQuery.isLoading) return
    if (typeFilter !== 'all' || statusFilter !== 'active') return
    if ((categoriesQuery.data ?? []).length > 0) return

    setHasAttemptedInit(true)
    initializeMutation.mutate()
  }, [hasAttemptedInit, categoriesQuery.isLoading, categoriesQuery.data, typeFilter, statusFilter, initializeMutation])

  const openCreateForm = () => {
    setEditingCategory(null)
    reset(emptyValues)
    setIsFormOpen(true)
  }

  const openEditForm = (category) => {
    setEditingCategory(category)
    reset({ name: category.name, type: category.type, is_essential: category.is_essential })
    setIsFormOpen(true)
  }

  const closeForm = () => setIsFormOpen(false)

  const onSubmit = async (values) => {
    const payload = { ...values, is_essential: values.type === 'income' ? false : values.is_essential }

    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({ id: editingCategory.id, data: payload })
        toast.success('Category updated')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Category added')
      }
      setIsFormOpen(false)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  const requestToggleActive = (category) => setPendingToggle(category)
  const cancelToggleActive = () => setPendingToggle(null)

  const confirmToggleActive = async () => {
    if (!pendingToggle) return
    try {
      if (pendingToggle.is_active) {
        await deactivateMutation.mutateAsync(pendingToggle.id)
        toast.success('Category archived')
      } else {
        await activateMutation.mutateAsync(pendingToggle.id)
        toast.success('Category restored')
      }
      setPendingToggle(null)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  return {
    categories: categoriesQuery.data ?? [],
    isLoading: categoriesQuery.isLoading,
    isError: categoriesQuery.isError,
    refetch: categoriesQuery.refetch,

    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,

    isFormOpen,
    isEditing: Boolean(editingCategory),
    openCreateForm,
    openEditForm,
    closeForm,
    register,
    errors,
    watchedType,
    onSubmit: handleSubmit(onSubmit),
    saving: createMutation.isPending || updateMutation.isPending,

    pendingToggle,
    requestToggleActive,
    cancelToggleActive,
    confirmToggleActive,
    togglingActive: deactivateMutation.isPending || activateMutation.isPending,
  }
}

export default useActionCategory
