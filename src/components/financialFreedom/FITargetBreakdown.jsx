import { formatCurrency } from '../../utils/finance/currency'
import styles from './FITargetBreakdown.module.css'

const FITargetBreakdown = ({ spending, estimatedAnnualSpending, fiMultiplier, fiTarget, currency }) => {
  if (spending.monthsUsed === 0) {
    return (
      <div>
        <p className="text-section-title">FI Target Breakdown</p>
        <p className="text-secondary">Not enough spending history to estimate a target yet.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-section-title">FI Target Breakdown</p>
      <p className="text-caption">Based on your recent spending history ({spending.monthsUsed} completed months).</p>

      <div className={styles.rows}>
        <div className={styles.row}>
          <span className="text-label">Average monthly spending</span>
          <span className="text-body">{formatCurrency(spending.average, currency)}</span>
        </div>
        <div className={styles.row}>
          <span className="text-label">Average essential monthly spending</span>
          <span className="text-body">{formatCurrency(spending.essentialAverage, currency)}</span>
        </div>
        <div className={styles.row}>
          <span className="text-label">Estimated annual spending</span>
          <span className="text-body">{formatCurrency(estimatedAnnualSpending, currency)}</span>
        </div>
        <div className={styles.row}>
          <span className="text-label">FI multiplier</span>
          <span className="text-body">{fiMultiplier}×</span>
        </div>
        <div className={styles.row}>
          <span className="text-label">Estimated FI target</span>
          <span className="text-metric">{formatCurrency(fiTarget, currency)}</span>
        </div>
      </div>
    </div>
  )
}

export default FITargetBreakdown
