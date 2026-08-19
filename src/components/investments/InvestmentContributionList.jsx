import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Icon from '../ui/Icon'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './InvestmentContributionList.module.css'

const STATUS_VARIANT = { completed: 'success', skipped: 'neutral' }

// A simple vertical list, not a table — each entry is one recorded (or
// explicitly skipped) contribution toward a holding.
const InvestmentContributionList = ({ contributions, onEdit, onDelete }) => (
  <div className={styles.list}>
    {contributions.map((contribution) => (
      <div key={contribution.id} className={styles.row}>
        <span className={styles.rowIcon}>
          <Icon name={contribution.status === 'skipped' ? 'close' : 'chartCandlestick'} size="var(--icon-sm)" />
        </span>
        <div className={styles.identity}>
          <p className="text-card-title">{contribution.holdingName}</p>
          <p className="text-caption">
            {contribution.contribution_date}
            {contribution.planName ? ` · ${contribution.planName}` : ''}
          </p>
          {contribution.notes && <p className="text-caption">&ldquo;{contribution.notes}&rdquo;</p>}
        </div>
        <div className={styles.trailing}>
          <p className="text-body">{formatCurrency(contribution.amount, contribution.currency)}</p>
          <Badge variant={STATUS_VARIANT[contribution.status] ?? 'neutral'}>{contribution.status}</Badge>
        </div>
        <div className={styles.actions}>
          <Button variant="ghost" className={styles.actionButton} onClick={() => onEdit(contribution)}>
            Edit
          </Button>
          <Button variant="ghost" className={styles.actionButton} onClick={() => onDelete(contribution)}>
            Delete
          </Button>
        </div>
      </div>
    ))}
  </div>
)

export default InvestmentContributionList
