import Icon from '../ui/Icon'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './EmergencyFundCompletion.module.css'

// Estimate only — framed accordingly rather than as a guaranteed date.
const EmergencyFundCompletion = ({ contributionMonths, estimatedCompletionDate, monthlyContribution, currency }) => {
  return (
    <div>
      <div className={styles.title}>
        <Icon name="calendarCheck" size="var(--icon-sm)" className={styles.titleIcon} />
        <p className="text-section-title">Estimated Completion</p>
      </div>

      {contributionMonths === null && (
        <>
          <p className={`text-hero-metric ${styles.value}`}>No monthly contribution set</p>
          <p className="text-caption">Add a monthly contribution to estimate when the target could be reached.</p>
        </>
      )}

      {contributionMonths === 0 && <p className={`text-hero-metric ${styles.reached}`}>Target reached</p>}

      {contributionMonths > 0 && estimatedCompletionDate && (
        <>
          <p className={`text-hero-metric ${styles.value}`}>{estimatedCompletionDate}</p>
          <p className="text-caption">
            At {formatCurrency(monthlyContribution, currency)}/month · estimate, not a guarantee
          </p>
        </>
      )}
    </div>
  )
}

export default EmergencyFundCompletion
