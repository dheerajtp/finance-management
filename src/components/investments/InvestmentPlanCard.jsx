import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { INVESTMENT_FREQUENCY_MAP } from '../../constants/investmentFrequencies'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './InvestmentPlanCard.module.css'

const STATUS_LABELS = { active: 'Active', paused: 'Paused', ended: 'Ended', due: 'Due', overdue: 'Overdue', completed: 'Completed' }

// Restrained on purpose — an overdue SIP is normal (nothing was lost,
// nothing ran automatically), so it reads as a muted warning, never danger
// red.
const STATUS_VARIANT = { active: 'neutral', paused: 'neutral', ended: 'neutral', due: 'info', overdue: 'warning', completed: 'success' }

const InvestmentPlanCard = ({ plan, holdingName, onRecord, onSkip, onEdit, onPause, onResume }) => {
  const frequencyLabel = INVESTMENT_FREQUENCY_MAP[plan.frequency]?.label ?? plan.frequency
  const canAct = plan.is_active && (plan.status === 'due' || plan.status === 'overdue')

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className="text-card-title">{plan.name}</p>
          <p className="text-caption">{holdingName}</p>
        </div>
        <Badge variant={STATUS_VARIANT[plan.status] ?? 'neutral'}>{STATUS_LABELS[plan.status] ?? plan.status}</Badge>
      </div>

      <p className="text-metric">{formatCurrency(plan.amount, plan.currency)}</p>
      <p className="text-secondary">
        {frequencyLabel}
        {plan.contribution_day ? ` · Day ${plan.contribution_day}` : ''}
      </p>

      {plan.status !== 'ended' && (
        <p className="text-caption">
          {plan.status === 'overdue'
            ? `Overdue since ${plan.expectedDate}`
            : plan.status === 'due'
              ? 'Due today'
              : `Next expected: ${plan.expectedDate}`}
        </p>
      )}

      <div className={styles.actions}>
        {canAct && (
          <>
            <Button variant="primary" onClick={() => onRecord(plan)}>
              Record contribution
            </Button>
            <Button variant="ghost" onClick={() => onSkip(plan)}>
              Skip
            </Button>
          </>
        )}
        <Button variant="ghost" onClick={() => onEdit(plan)}>
          Edit
        </Button>
        {plan.is_active ? (
          <Button variant="ghost" onClick={() => onPause(plan)}>
            Pause
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => onResume(plan)}>
            Resume
          </Button>
        )}
      </div>
    </Card>
  )
}

export default InvestmentPlanCard
