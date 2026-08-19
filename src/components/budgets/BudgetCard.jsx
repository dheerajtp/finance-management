import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Progress from '../ui/Progress'
import Button from '../ui/Button'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './BudgetCard.module.css'

const STATUS_LABELS = {
  no_spending: 'No spending',
  on_track: 'On track',
  attention: 'Attention',
  near_limit: 'Near limit',
  over_budget: 'Over budget',
}

const STATUS_BADGE_VARIANT = {
  no_spending: 'neutral',
  on_track: 'success',
  attention: 'info',
  near_limit: 'warning',
  over_budget: 'danger',
}

// Consistent with getBudgetStatus's own thresholds (utils/finance/budgets.js)
// — on_track reads calm/positive, only over_budget reads as alarming.
const PROGRESS_STATE = { on_track: 'success', attention: 'warning', near_limit: 'warning', over_budget: 'danger' }

const BudgetCard = ({ budget, onEdit, onToggleActive }) => {
  const classification =
    budget.categoryIsEssential === null ? '' : budget.categoryIsEssential ? 'Essential' : 'Discretionary'
  const isOver = budget.overBy > 0

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className="text-card-title">{budget.categoryName}</p>
          <p className="text-caption">
            {classification}
            {budget.categoryInactive ? (classification ? ' · Category inactive' : 'Category inactive') : ''}
          </p>
        </div>
        <div className={styles.badges}>
          {!budget.is_active && <Badge variant="neutral">Inactive</Badge>}
          <Badge variant={STATUS_BADGE_VARIANT[budget.status] ?? 'neutral'}>
            {STATUS_LABELS[budget.status] ?? budget.status}
          </Badge>
        </div>
      </div>

      <Progress
        percentage={budget.progress}
        value={`${formatCurrency(budget.spent, budget.currency)} / ${formatCurrency(budget.amount, budget.currency)}`}
        state={PROGRESS_STATE[budget.status] ?? 'default'}
      />

      <div className={styles.stats}>
        <div>
          <p className="text-label">Budget</p>
          <p className="text-body">{formatCurrency(budget.amount, budget.currency)}</p>
        </div>
        <div>
          <p className="text-label">Spent</p>
          <p className="text-body">{formatCurrency(budget.spent, budget.currency)}</p>
        </div>
        <div>
          <p className="text-label">{isOver ? 'Overage' : 'Remaining'}</p>
          <p className={isOver ? 'text-delta text-delta--down' : 'text-body'}>
            {formatCurrency(isOver ? budget.overBy : budget.remaining, budget.currency)}
          </p>
        </div>
      </div>

      <p className="text-caption">{budget.message}</p>

      {budget.historicalAverage.average !== null && (
        <p className="text-caption">
          Your recent average is {formatCurrency(budget.historicalAverage.average, budget.currency)}/month.
        </p>
      )}

      <div className={styles.actions}>
        <Button variant="ghost" onClick={() => onEdit(budget)}>
          Edit
        </Button>
        <Button variant="ghost" onClick={() => onToggleActive(budget)}>
          {budget.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </Card>
  )
}

export default BudgetCard
