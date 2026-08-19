import { formatCurrency } from '../../utils/finance/currency'
import styles from './TargetCalculationBreakdown.module.css'

// Informational only — makes the existing target formula (average essential
// spend × target months) visible, using the same values the hook already
// derives. No calculation happens here.
const TargetCalculationBreakdown = ({ baseline, targetMonths, target, currency, status }) => {
  const unavailable = status === 'no_data' || status === 'insufficient_history'

  return (
    <div>
      <p className="text-section-title">How your target is calculated</p>
      <p className="text-caption">Your emergency fund target is based on your average essential monthly expenses.</p>

      <div className={styles.formula}>
        <div className={styles.term}>
          <p className={`text-metric ${styles.termValue}`}>
            {unavailable ? '—' : formatCurrency(baseline.average, currency)}
          </p>
          <p className="text-caption">Average essential monthly expenses</p>
        </div>

        <span className={styles.operator} aria-hidden="true">
          ×
        </span>

        <div className={styles.term}>
          <p className={`text-metric ${styles.termValue}`}>{targetMonths} months</p>
          <p className="text-caption">Target duration</p>
        </div>

        <span className={styles.operator} aria-hidden="true">
          =
        </span>

        <div className={styles.term}>
          <p className={`text-hero-metric ${styles.result}`}>{unavailable ? '—' : formatCurrency(target, currency)}</p>
          <p className="text-caption">Estimated emergency fund target</p>
        </div>
      </div>

      {unavailable && (
        <p className={`text-caption ${styles.notice}`}>
          We don&rsquo;t have enough essential-spending history yet to calculate this. It will appear once more months of
          spending are recorded.
        </p>
      )}
    </div>
  )
}

export default TargetCalculationBreakdown
