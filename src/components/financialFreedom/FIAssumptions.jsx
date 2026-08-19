import { formatCurrency } from '../../utils/finance/currency'
import styles from './FIAssumptions.module.css'

const FIAssumptions = ({
  analysisMonths,
  fiMultiplier,
  expectedAnnualReturn,
  monthlyContribution,
  selectedAccountsCount,
  currency,
}) => {
  return (
    <div>
      <p className="text-section-title">Assumptions</p>
      <div className={styles.rows}>
        <div className={styles.row}>
          <span className="text-label">Analysis period</span>
          <span className="text-body">{analysisMonths} months</span>
        </div>
        <div className={styles.row}>
          <span className="text-label">FI multiplier</span>
          <span className="text-body">{fiMultiplier}×</span>
        </div>
        <div className={styles.row}>
          <span className="text-label">Assumed annual return</span>
          <span className="text-body">{expectedAnnualReturn}%</span>
        </div>
        <div className={styles.row}>
          <span className="text-label">Monthly contribution</span>
          <span className="text-body">{formatCurrency(monthlyContribution, currency)}</span>
        </div>
        <div className={styles.row}>
          <span className="text-label">Selected FI accounts</span>
          <span className="text-body">{selectedAccountsCount}</span>
        </div>
        <div className={styles.row}>
          <span className="text-label">Currency</span>
          <span className="text-body">{currency ?? '—'}</span>
        </div>
      </div>
      <p className="text-caption">Every value above is an estimate, editable in the settings area — not guaranteed.</p>
    </div>
  )
}

export default FIAssumptions
