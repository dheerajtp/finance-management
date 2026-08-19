import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
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

  const groups = [
    { key: 'income', title: 'Income', items: categories.filter((category) => category.type === 'income') },
    {
      key: 'essential',
      title: 'Essential',
      items: categories.filter((category) => category.type === 'expense' && category.is_essential),
    },
    {
      key: 'discretionary',
      title: 'Discretionary',
      items: categories.filter((category) => category.type === 'expense' && !category.is_essential),
    },
  ].filter((group) => group.items.length > 0)

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Classify your income and spending."
        actions={<Button onClick={openCreateForm}>
            <Icon name="plus" size="var(--icon-sm)" />
            Add Category
          </Button>}
      />

      <div className={styles.filters}>
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
        <div className={styles.list}>
          <Skeleton height="3rem" radius="var(--radius-lg)" />
          <Skeleton height="3rem" radius="var(--radius-lg)" />
          <Skeleton height="3rem" radius="var(--radius-lg)" />
          <Skeleton height="3rem" radius="var(--radius-lg)" />
        </div>
      )}

      {!isLoading && isError && <ErrorState message="We couldn't load your categories." onRetry={refetch} />}

      {!isLoading && !isError && categories.length === 0 && (
        <EmptyState
          icon="tag"
          title="No categories yet"
          description="Create categories to organize your income and spending."
          action={<Button onClick={openCreateForm}>
            <Icon name="plus" size="var(--icon-sm)" />
            Add Category
          </Button>}
        />
      )}

      {!isLoading &&
        !isError &&
        groups.map((group) => (
          <section key={group.key} className={styles.section}>
            <p className={`text-label ${styles.sectionTitle}`}>{group.title}</p>
            <div className={styles.list}>
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
