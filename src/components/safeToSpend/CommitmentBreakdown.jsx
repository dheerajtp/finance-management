import { Link } from 'react-router-dom'
import Card from '../ui/Card'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './CommitmentBreakdown.module.css'

const ZERO_CAPTION = {
  emergency_fund: {
    not_configured: 'Emergency fund not configured',
    target_reached: 'Target reached — no contribution needed',
    no_contribution_configured: 'No monthly contribution configured',
    already_recorded: "This month's contribution is already recorded",
  },
  investments: 'No active SIP commitment',
  goals: 'No goal contribution due this month',
  subscriptions: 'No subscriptions due this month',
  recurring: 'No recurring expenses due this month',
}

const zeroCaptionFor = (commitment) => {
  const caption = ZERO_CAPTION[commitment.key]
  if (typeof caption === 'string') return caption
  return caption?.[commitment.note] ?? 'Already accounted for'
}

// Purely presentational — every amount/note is already computed by
// summarizeSafeToSpend (utils/finance/safeToSpend.js). Essential expenses
// are shown as a fixed reference row (not a "commitment" the user
// configured, so it never links anywhere), then one row per commitment
// source.
const CommitmentBreakdown = ({ commitments, essentialExpenses, currency }) => (
  <Card>
    <p className="text-section-title">Commitment Breakdown</p>
    <p className="text-caption">What&rsquo;s already accounted for before flexible spending.</p>

    <div className={styles.list}>
      <div className={styles.row}>
        <span className="text-body">Essential expenses</span>
        <span className="text-card-title">{formatCurrency(essentialExpenses, currency)}</span>
      </div>

      {commitments.map((commitment) => (
        <div key={commitment.key} className={styles.row}>
          <div className={styles.identity}>
            <span className="text-body">{commitment.title}</span>
            {commitment.amount === 0 && <span className="text-caption">{zeroCaptionFor(commitment)}</span>}
          </div>
          <div className={styles.trailing}>
            <span className="text-card-title">{formatCurrency(commitment.amount, currency)}</span>
            {commitment.route && (
              <Link to={commitment.route} className={styles.link}>
                Review
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  </Card>
)

export default CommitmentBreakdown
