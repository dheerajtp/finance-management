import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Progress from '../ui/Progress'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './EmergencyFundStatus.module.css'

const STATUS_LABELS = {
  no_data: 'No data',
  insufficient_history: 'Insufficient history',
  getting_started: 'Getting started',
  building: 'Building',
  halfway: 'Halfway',
  strong: 'Strong',
  target_reached: 'Target reached',
}

// Restrained on purpose — most states stay neutral/info; only a target
// actually reached (or close to it) gets the calmer "success" tone.
const STATUS_BADGE_VARIANT = {
  no_data: 'neutral',
  insufficient_history: 'neutral',
  getting_started: 'neutral',
  building: 'info',
  halfway: 'info',
  strong: 'success',
  target_reached: 'success',
}

// These two statuses mean the target was computed from too little essential-
// spending history to mean anything — never presented as a real number.
const TARGET_UNAVAILABLE_STATUSES = new Set(['no_data', 'insufficient_history'])

// The page's hero panel — current balance and target sit side by side as the
// two numbers that matter most, with progress and remaining as supporting
// detail. Follows the same hero shape as SavingsTarget/NetPosition.
const EmergencyFundStatus = ({ target, current, remaining, amountAboveTarget, progress, status, currency, targetMonths }) => {
  const targetUnavailable = TARGET_UNAVAILABLE_STATUSES.has(status)

  const remainingValue =
    remaining === null
      ? '—'
      : remaining === 0 && amountAboveTarget > 0
        ? `${formatCurrency(amountAboveTarget, currency)} above target`
        : formatCurrency(remaining, currency)

  return (
    <Card variant="hero" className={styles.card}>
      <div className={styles.header}>
        <p className="text-section-title">Emergency Fund</p>
        <Badge variant={STATUS_BADGE_VARIANT[status] ?? 'neutral'}>{STATUS_LABELS[status] ?? status}</Badge>
      </div>

      <div className={styles.stats}>
        <div>
          <p className="text-label">Current balance</p>
          <p className={`text-hero-metric ${styles.value}`}>
            {current === null ? 'Select an account' : formatCurrency(current, currency)}
          </p>
        </div>
        <div>
          <p className="text-label">Target</p>
          <p className={`text-hero-metric ${styles.value} ${targetUnavailable ? styles.muted : ''}`}>
            {targetUnavailable ? '—' : formatCurrency(target, currency)}
          </p>
        </div>
      </div>

      {targetUnavailable ? (
        <p className={`text-secondary ${styles.notice}`}>
          Target not available yet. We need more essential-spending history before we can calculate your emergency
          fund target.
        </p>
      ) : (
        progress !== null && (
          <>
            <Progress percentage={progress} state={progress >= 100 ? 'success' : 'default'} />
            <div className={styles.footer}>
              <span className="text-metric">{progress.toFixed(0)}%</span>
              <span className="text-caption">
                {remaining === 0 && target !== null ? 'Target reached' : 'Remaining'}: {remainingValue}
              </span>
            </div>
            <p className="text-caption">Based on a {targetMonths}-month target of essential expenses.</p>
          </>
        )
      )}
    </Card>
  )
}

export default EmergencyFundStatus
