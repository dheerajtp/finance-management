import Card from '../ui/Card'
import Icon from '../ui/Icon'
import EmptyState from '../ui/EmptyState'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './UpcomingInvestmentContributions.module.css'

const occurrenceLabel = (plan) => {
  if (plan.status === 'overdue') return `${Math.abs(plan.daysUntil)}d overdue`
  if (plan.status === 'due') return 'Due today'
  return `in ${plan.daysUntil}d`
}

// Real upcoming SIP occurrences only — nothing fabricated, and never more
// than one occurrence per plan (see calculateExpectedContributionDate).
const UpcomingInvestmentContributions = ({ plans }) => (
  <Card>
    <p className="text-section-title">Upcoming Contributions</p>

    {plans.length === 0 ? (
      <EmptyState icon="calendarCheck" title="Nothing scheduled" description="Active SIPs due soon will show up here." />
    ) : (
      <div className={styles.list}>
        {plans.map((plan) => (
          <div key={plan.id} className={styles.row}>
            <span className={styles.rowIcon}>
              <Icon name="calendarCheck" size="var(--icon-sm)" />
            </span>
            <div className={styles.identity}>
              <p className="text-card-title">{plan.name}</p>
              <p className="text-caption">{occurrenceLabel(plan)}</p>
            </div>
            <p className="text-body">{formatCurrency(plan.amount, plan.currency)}</p>
          </div>
        ))}
      </div>
    )}
  </Card>
)

export default UpcomingInvestmentContributions
