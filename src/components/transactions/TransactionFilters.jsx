import Card from '../ui/Card'
import Input from '../ui/Input'
import Select from '../ui/Select'
import styles from './TransactionFilters.module.css'

const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
]

const DATE_RANGE_OPTIONS = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'all_time', label: 'All time' },
]

const TransactionFilters = ({
  typeFilter,
  setTypeFilter,
  accountFilter,
  setAccountFilter,
  accountFilterOptions,
  categoryFilter,
  setCategoryFilter,
  categoryFilterOptions,
  dateRangeFilter,
  setDateRangeFilter,
  search,
  setSearch,
}) => {
  return (
    <Card variant="flat" className={styles.filters}>
      <Select
        id="type-filter"
        label="Type"
        options={TYPE_OPTIONS}
        value={typeFilter}
        onChange={(event) => setTypeFilter(event.target.value)}
      />
      <Select
        id="account-filter"
        label="Account"
        options={accountFilterOptions}
        value={accountFilter}
        onChange={(event) => setAccountFilter(event.target.value)}
      />
      <Select
        id="category-filter"
        label="Category"
        options={categoryFilterOptions}
        value={categoryFilter}
        onChange={(event) => setCategoryFilter(event.target.value)}
      />
      <Select
        id="date-range-filter"
        label="Date range"
        options={DATE_RANGE_OPTIONS}
        value={dateRangeFilter}
        onChange={(event) => setDateRangeFilter(event.target.value)}
      />
      <Input
        id="search"
        label="Search"
        placeholder="Search description"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
    </Card>
  )
}

export default TransactionFilters
