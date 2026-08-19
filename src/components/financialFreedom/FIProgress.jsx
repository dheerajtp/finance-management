import Card from '../ui/Card'
import Progress from '../ui/Progress'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './FIProgress.module.css'

// The flagship panel for the Financial Freedom page — current FI assets is
// the dominant number, framed against the estimated target, gap and progress
// already computed by useActionFinancialFreedom. No new calculations here,
// just a bigger, hero-weighted presentation of the same figures.
const FIProgress = ({ currentFIAssets, fiTarget, fiGap, fiProgress, currency }) => {
  return (
    <Card variant="hero" className={styles.card}>
      <p className="text-section-title">FI Progress</p>

      <p className="text-label">Current FI assets</p>
      <p className={`text-hero-metric ${styles.value}`}>{formatCurrency(currentFIAssets, currency)}</p>

      <div className={styles.stats}>
        <div>
          <p className="text-label">Estimated FI target</p>
          <p className="text-card-title">
            {fiTarget === null ? 'Not yet available' : formatCurrency(fiTarget, currency)}
          </p>
        </div>
        <div>
          <p className="text-label">{fiGap === 0 && fiTarget !== null ? 'Estimated FI target reached' : 'Remaining'}</p>
          <p className="text-card-title">{fiGap === null ? '—' : formatCurrency(fiGap, currency)}</p>
        </div>
      </div>

      {fiProgress !== null && (
        <>
          <Progress percentage={fiProgress} state={fiProgress >= 100 ? 'success' : 'default'} />
          <div className={styles.footer}>
            <span className="text-metric">{fiProgress.toFixed(0)}%</span>
            <span className="text-caption">of your estimated FI target</span>
          </div>
        </>
      )}
    </Card>
  )
}

export default FIProgress
