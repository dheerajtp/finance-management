import { Link } from 'react-router-dom'
import Progress from '../ui/Progress'
import Icon from '../ui/Icon'
import DonutChart from '../ui/DonutChart'
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
    <section className={styles.section}>
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
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <Icon name="barChart" size="var(--icon-lg)" />
          </span>
          <div className={styles.emptyText}>
            <p className={styles.emptyTitle}>Your spending picture will appear here</p>
            <p className={styles.emptyDescription}>Categorize your expenses to see your essential vs. discretionary split.</p>
          </div>
        </div>
      ) : (
        <div className={styles.chartLayout}>
          <DonutChart
            size={110}
            strokeWidth={12}
            segments={[
              { value: breakdown.essential, color: 'var(--color-success)' },
              { value: breakdown.discretionary, color: 'var(--color-accent)' },
              { value: breakdown.uncategorized, color: 'var(--color-warning)' },
            ]}
            centerLabel={`${Math.round(breakdown.essentialPercentage)}%`}
            centerSublabel="essential"
          />
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
        </div>
      )}
    </section>
  )
}

export default SpendingBreakdown
