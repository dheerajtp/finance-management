import Card from '../ui/Card'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './SafeToSpendSummary.module.css'

// Purely presentational — every number is already computed (see
// utils/finance/safeToSpend.js summarizeSafeToSpend). No "you should
// spend" language anywhere; this only reports what's available and why.
const SafeToSpendSummary = ({ monthLabel, currency, hasIncome, isOverCommitted, availableAmount, overCommittedAmount, income, essentialExpenses, committedAmount }) => (
  <Card variant="hero" className={styles.card}>
    <div className={styles.header}>
      <p className="text-section-title">Safe to Spend</p>
      <span className="text-caption">{monthLabel}</span>
    </div>

    {!hasIncome ? (
      <p className={`text-secondary ${styles.notice}`}>
        Safe-to-spend amount isn&rsquo;t available because no income has been recorded for this month.
      </p>
    ) : isOverCommitted ? (
      <>
        <p className={`text-hero-metric ${styles.overAmount}`}>{formatCurrency(overCommittedAmount, currency)}</p>
        <p className="text-caption">over recorded income</p>
        <p className={`text-secondary ${styles.notice}`}>
          Your current planned commitments exceed this month&rsquo;s recorded income by {formatCurrency(overCommittedAmount, currency)}.
        </p>
      </>
    ) : (
      <>
        <p className={`text-hero-metric ${styles.amount}`}>{formatCurrency(availableAmount, currency)}</p>
        <p className="text-caption">available for flexibility</p>
      </>
    )}

    <div className={styles.rows}>
      <div className={styles.row}>
        <span className="text-secondary">Income</span>
        <span className="text-body">{formatCurrency(income, currency)}</span>
      </div>
      <div className={styles.row}>
        <span className="text-secondary">Essential expenses</span>
        <span className="text-body">{formatCurrency(essentialExpenses, currency)}</span>
      </div>
      <div className={styles.row}>
        <span className="text-secondary">Planned commitments</span>
        <span className="text-body">{formatCurrency(committedAmount, currency)}</span>
      </div>
    </div>

    {hasIncome && !isOverCommitted && (
      <p className={`text-secondary ${styles.footnote}`}>
        You have {formatCurrency(availableAmount, currency)} available for flexible spending after your essential expenses and
        configured financial commitments.
      </p>
    )}
  </Card>
)

export default SafeToSpendSummary
