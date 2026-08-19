import { useState, useMemo } from 'react'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import Input from '../components/ui/Input'
import PageHeader from '../components/ui/PageHeader'
import Select from '../components/ui/Select'
import Skeleton from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import CategoryForm from '../components/forms/categories/CategoryForm'
import CategoryCard from '../components/categories/CategoryCard'
import useActionCategory from '../hooks/functionality/useActionCategory'
import styles from './CategoriesPage.module.css'

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
]

const STATUS_FILTER_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'all', label: 'All' },
]

const CategoriesPage = () => {
  const {
    categories,
    isLoading,
    isError,
    refetch,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    isFormOpen,
    isEditing,
    openCreateForm,
    openEditForm,
    closeForm,
    register,
    errors,
    watchedType,
    onSubmit,
    saving,
    pendingToggle,
    requestToggleActive,
    cancelToggleActive,
    confirmToggleActive,
    togglingActive,
  } = useActionCategory()

  const [search, setSearch] = useState('')

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories
    const q = search.trim().toLowerCase()
    return categories.filter((c) => c.name.toLowerCase().includes(q))
  }, [categories, search])

  const groups = [
    { key: 'income', title: 'Income', items: filteredCategories.filter((category) => category.type === 'income') },
    {
      key: 'essential',
      title: 'Essential',
      items: filteredCategories.filter((category) => category.type === 'expense' && category.is_essential),
    },
    {
      key: 'discretionary',
      title: 'Discretionary',
      items: filteredCategories.filter((category) => category.type === 'expense' && !category.is_essential),
    },
  ].filter((group) => group.items.length > 0)

  return (
    <div className={styles.page}>
      <PageHeader
        title="Categories"
        description="Organize your income and spending."
        actions={
          <Button onClick={openCreateForm}>
            <Icon name="plus" size="var(--icon-sm)" />
            Add Category
          </Button>
        }
      />

      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <Input
            id="category-search"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<Icon name="search" size="var(--icon-sm)" />}
          />
        </div>
        <Select
          id="category-type-filter"
          label="Type"
          options={TYPE_FILTER_OPTIONS}
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        />
        <Select
          id="category-status-filter"
          label="Status"
          options={STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        />
      </div>

      {isLoading && (
        <div className={styles.grid}>
          <Skeleton height="96px" radius="var(--radius-lg)" />
          <Skeleton height="96px" radius="var(--radius-lg)" />
          <Skeleton height="96px" radius="var(--radius-lg)" />
          <Skeleton height="96px" radius="var(--radius-lg)" />
          <Skeleton height="96px" radius="var(--radius-lg)" />
          <Skeleton height="96px" radius="var(--radius-lg)" />
        </div>
      )}

      {!isLoading && isError && <ErrorState message="We couldn't load your categories." onRetry={refetch} />}

      {!isLoading && !isError && categories.length === 0 && (
        <EmptyState
          icon="tag"
          title="No categories yet"
          description="Create categories to organize your income and spending."
          action={
            <Button onClick={openCreateForm}>
              <Icon name="plus" size="var(--icon-sm)" />
              Add Category
            </Button>
          }
        />
      )}

      {!isLoading && !isError && filteredCategories.length === 0 && categories.length > 0 && (
        <EmptyState
          icon="search"
          title="No matching categories"
          description={`No categories match "${search}". Try a different search or filter.`}
        />
      )}

      {!isLoading &&
        !isError &&
        groups.map((group) => (
          <section key={group.key} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{group.title}</h2>
              <span className={styles.sectionCount}>{group.items.length}</span>
            </div>
            <div className={styles.grid}>
              {group.items.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onEdit={openEditForm}
                  onToggleActive={requestToggleActive}
                />
              ))}
            </div>
          </section>
        ))}

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={isEditing ? 'Edit Category' : 'Add Category'}
        icon={isEditing ? 'pencil' : 'tag'}
        size="sm"
      >
        <CategoryForm
          register={register}
          onSubmit={onSubmit}
          errors={errors}
          saving={saving}
          watchedType={watchedType}
          submitLabel={isEditing ? 'Save changes' : 'Add category'}
        />
      </Modal>

      <ConfirmModal
        isOpen={Boolean(pendingToggle)}
        onClose={cancelToggleActive}
        onConfirm={confirmToggleActive}
        title={pendingToggle?.is_active ? 'Archive category?' : 'Restore category?'}
        message={
          pendingToggle?.is_active
            ? `${pendingToggle?.name} will be hidden from active categories. You can restore it anytime.`
            : `${pendingToggle?.name} will show up in your active categories again.`
        }
        confirmLabel={pendingToggle?.is_active ? 'Archive' : 'Restore'}
        variant={pendingToggle?.is_active ? 'danger' : 'primary'}
        loading={togglingActive}
      />
    </div>
  )
}

export default CategoriesPage
