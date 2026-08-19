import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Progress from '../ui/Progress'
import { FLEXIBLE_CATEGORY_LABEL } from '../../constants/flexibleSpending'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './FlexibleSpendingCard.module.css'

const STATUS_LABEL = { not_configured: 'Not allocated', on_track: 'On track', needs_attention: 'Needs attention' }
const STATUS_VARIANT = { not_configured: 'neutral', on_track: 'success', needs_attention: 'warning' }

// Purely presentational — allocated/spent/remaining/status are already
// computed by summarizeSafeToSpend (utils/finance/safeToSpend.js). Budget
// comparison is shown, never merged into, the flexible allocation figure —
// the two systems stay visually distinct.
const FlexibleSpendingCard = ({ category, budgetAmount, currency }) => {
  const label = FLEXIBLE_CATEGORY_LABEL[category.key]
  const isOver = category.remaining < 0

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <span className="text-card-title">{label}</span>
        <Badge variant={STATUS_VARIANT[category.status] ?? 'neutral'}>{STATUS_LABEL[category.status] ?? category.status}</Badge>
      </div>

      <p className="text-metric">{formatCurrency(category.spent, currency)}</p>
      <p className="text-caption">of {formatCurrency(category.allocated, currency)} allocated</p>

      {category.allocated > 0 && (
        <Progress
          percentage={category.allocated > 0 ? (category.spent / category.allocated) * 100 : 0}
          label={`${label} spending`}
          state={isOver ? 'warning' : 'default'}
        />
      )}

      <p className={`text-caption ${styles.remaining}`}>
        {isOver
          ? `${formatCurrency(Math.abs(category.remaining), currency)} above allocation`
          : `${formatCurrency(category.remaining, currency)} remaining`}
      </p>

      {typeof budgetAmount === 'number' && (
        <p className="text-caption">Existing budget for related categories: {formatCurrency(budgetAmount, currency)}</p>
      )}
    </Card>
  )
}

export default FlexibleSpendingCard
