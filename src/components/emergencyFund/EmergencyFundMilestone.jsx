import Icon from '../ui/Icon'
import Progress from '../ui/Progress'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './EmergencyFundMilestone.module.css'

const TITLE = (
  <div className={styles.title}>
    <Icon name="flag" size="var(--icon-sm)" className={styles.titleIcon} />
    <p className="text-section-title">Next Milestone</p>
  </div>
)

const EmergencyFundMilestone = ({ progress, current, target, nextMilestone, currency, status }) => {
  if (status === 'no_data' || status === 'insufficient_history') {
    return (
      <div>
        {TITLE}
        <p className="text-secondary">Milestones will appear once we have enough spending history to set a target.</p>
      </div>
    )
  }

  if (progress === null) {
    return (
      <div>
        {TITLE}
        <p className="text-secondary">Milestones will appear once your target and current balance are known.</p>
      </div>
    )
  }

  if (!nextMilestone) {
    return (
      <div>
        {TITLE}
        <p className={`text-hero-metric ${styles.reached}`}>Target reached</p>
      </div>
    )
  }

  return (
    <div>
      {TITLE}
      <p className={`text-hero-metric ${styles.value}`}>{progress.toFixed(0)}% funded</p>
      <p className={`text-caption ${styles.amounts}`}>
        {formatCurrency(current, currency)} / {formatCurrency(target, currency)}
      </p>
      <Progress percentage={progress} />
      <p className={`text-caption ${styles.remaining}`}>
        {formatCurrency(nextMilestone.amountRemaining, currency)} to reach {nextMilestone.percentage}%
      </p>
    </div>
  )
}

export default EmergencyFundMilestone
