import Select from '../ui/Select'
import Input from '../ui/Input'
import EmptyState from '../ui/EmptyState'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import InvestmentHoldingCard from './InvestmentHoldingCard'
import { INVESTMENT_TYPES } from '../../constants/investmentTypes'
import styles from './InvestmentHoldings.module.css'

const SORT_OPTIONS = [
  { value: 'current_value', label: 'Current value' },
  { value: 'gain', label: 'Gain/loss' },
  { value: 'name', label: 'Name' },
  { value: 'invested_amount', label: 'Invested amount' },
]

const InvestmentHoldings = ({
  holdings,
  hasAnyHoldings,
  currencyFilter,
  setCurrencyFilter,
  currencyOptions,
  typeFilter,
  setTypeFilter,
  showInactive,
  setShowInactive,
  search,
  setSearch,
  sortBy,
  setSortBy,
  onAddHolding,
  onEdit,
  onManageSip,
  onToggleActive,
}) => (
  <section className={styles.holdings}>
    <div className={styles.head}>
      <h2 className="text-section-title">Investment Holdings</h2>
    </div>

    {hasAnyHoldings && (
      <div className={styles.filters}>
        <Input id="holding-search" label="Search" placeholder="Search by name" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select
          id="holding-currency-filter"
          label="Currency"
          options={[{ value: 'all', label: 'All currencies' }, ...currencyOptions]}
          value={currencyFilter}
          onChange={(event) => setCurrencyFilter(event.target.value)}
        />
        <Select
          id="holding-type-filter"
          label="Type"
          options={[{ value: 'all', label: 'All types' }, ...INVESTMENT_TYPES]}
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        />
        <Select
          id="holding-sort"
          label="Sort by"
          options={SORT_OPTIONS}
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
        />
        <label className={styles.toggle}>
          <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />
          Show inactive
        </label>
      </div>
    )}

    {!hasAnyHoldings ? (
      <EmptyState
        icon="chartCandlestick"
        title="No investments yet"
        description="Add an existing investment — mutual funds, stocks, PPF, or anything else — without needing to recreate its history."
        action={
          <Button onClick={onAddHolding}>
            <Icon name="plus" size="var(--icon-sm)" />
            Add Investment
          </Button>
        }
      />
    ) : holdings.length === 0 ? (
      <EmptyState icon="chartCandlestick" title="No investments match your filters" description="Try a different search or filter." />
    ) : (
      <div className={styles.grid}>
        {holdings.map((holding) => (
          <InvestmentHoldingCard
            key={holding.id}
            holding={holding}
            onEdit={onEdit}
            onManageSip={onManageSip}
            onToggleActive={onToggleActive}
          />
        ))}
      </div>
    )}
  </section>
)

export default InvestmentHoldings
