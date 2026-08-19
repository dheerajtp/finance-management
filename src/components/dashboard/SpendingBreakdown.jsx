import { Link } from 'react-router-dom'
import Progress from '../ui/Progress'
import EmptyState from '../ui/EmptyState'
import Icon from '../ui/Icon'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './SpendingBreakdown.module.css'

// Essential reads calm (success), uncategorized reads as something worth
// fixing (warning) — discretionary is neither good nor bad on its own, so
// it stays neutral. Restrained on purpose, not a chart library.
const ROWS = [
  { key: 'essential', label: 'Essential', state: 'success' },
  { key: 'discretionary', label: 'Discretionary', state: 'default' },
  { key: 'uncategorized', label: 'Uncategorized', state: 'warning' },
]

const SpendingBreakdown = ({ breakdown, currency }) => {
  return (
    <section>
      <div className={styles.head}>
        <p className="text-section-title">Spending Overview</p>
        {breakdown.total > 0 && (
          <Link to="/spending-analysis" className={styles.viewAll}>
            View spending analysis
            <Icon name="chevronRight" size="var(--icon-xs)" />
          </Link>
        )}
      </div>

      {breakdown.total === 0 ? (
        <EmptyState
          icon="barChart"
          title="Your spending picture will appear here"
          description="Categorize your expenses to see your essential vs. discretionary split."
        />
      ) : (
        <div className={styles.list}>
          {ROWS.map((row) => (
            <Progress
              key={row.key}
              label={row.label}
              value={`${formatCurrency(breakdown[row.key], currency)} · ${Math.round(breakdown[`${row.key}Percentage`])}%`}
              percentage={breakdown[`${row.key}Percentage`]}
              state={row.state}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default SpendingBreakdown
