import { useNavigate } from 'react-router-dom'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Progress from '../ui/Progress'
import Button from '../ui/Button'
import { GOAL_TYPE_MAP } from '../../constants/goalTypes'
import { GOAL_PRIORITY_MAP } from '../../constants/goalPriority'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './GoalCard.module.css'

const STATUS_LABELS = {
  target_reached: 'Target reached',
  on_track: 'On track',
  behind: 'Behind',
  no_target_date: 'No target date',
  inactive: 'Inactive',
}

const STATUS_BADGE_VARIANT = {
  target_reached: 'success',
  on_track: 'info',
  behind: 'warning',
  no_target_date: 'neutral',
  inactive: 'neutral',
}

const PROGRESS_STATE = { target_reached: 'success', behind: 'warning' }

const GoalCard = ({ goal, onEdit, onToggleActive, showNavActions = true }) => {
  const navigate = useNavigate()
  const typeLabel = GOAL_TYPE_MAP[goal.type]?.label ?? goal.type
  const priorityLabel = GOAL_PRIORITY_MAP[goal.priority]?.label ?? goal.priority

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className="text-card-title">{goal.name}</p>
          <p className="text-caption">
            {typeLabel} · {priorityLabel} priority
          </p>
        </div>
        <Badge variant={STATUS_BADGE_VARIANT[goal.status] ?? 'neutral'}>{STATUS_LABELS[goal.status] ?? goal.status}</Badge>
      </div>

      <div className={styles.headline}>
        <p className="text-metric">{formatCurrency(goal.current_amount, goal.currency)}</p>
        <p className="text-secondary">
          of {formatCurrency(goal.target_amount, goal.currency)} target ·{' '}
          {formatCurrency(goal.remaining, goal.currency)} remaining
        </p>
      </div>

      <Progress
        percentage={goal.progress}
        value={`${goal.progress.toFixed(0)}%`}
        state={PROGRESS_STATE[goal.status] ?? 'default'}
      />

      <div className={styles.meta}>
        <span className="text-caption">{goal.target_date ? `Target date: ${goal.target_date}` : 'No target date'}</span>
        {goal.requiredMonthlyContribution !== null && goal.requiredMonthlyContribution > 0 && (
          <span className="text-caption">
            {formatCurrency(goal.requiredMonthlyContribution, goal.currency)}/month needed
          </span>
        )}
      </div>

      <p className="text-secondary">{goal.insightMessage}</p>

      <div className={styles.actions}>
        {showNavActions && (
          <>
            <Button variant="primary" onClick={() => navigate(`/goals/${goal.id}`, { state: { openAdd: true } })}>
              Add contribution
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/goals/${goal.id}`)}>
              View details
            </Button>
          </>
        )}
        {onEdit && (
          <Button variant="ghost" onClick={() => onEdit(goal)}>
            Edit
          </Button>
        )}
        {onToggleActive && (
          <Button variant="ghost" onClick={() => onToggleActive(goal)}>
            {goal.is_active ? 'Deactivate' : 'Activate'}
          </Button>
        )}
      </div>
    </Card>
  )
}

export default GoalCard
