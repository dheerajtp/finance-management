import Button from '../ui/Button'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './GoalContributionHistory.module.css'

const GoalContributionHistory = ({ contributions, onEdit, onDelete }) => {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Description</th>
            <th scope="col" className={styles.amountHead}>
              Amount
            </th>
            <th scope="col" className={styles.actionsHead}>
              <span className={styles.srOnly}>Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {contributions.map((contribution) => (
            <tr key={contribution.id} className={styles.row}>
              <td className="text-secondary">{contribution.contribution_date}</td>
              <td>
                <p className="text-body">{contribution.description || '—'}</p>
              </td>
              <td className={`text-card-title ${styles.amount}`}>
                {formatCurrency(contribution.amount, contribution.currency)}
              </td>
              <td className={styles.actions}>
                <Button variant="ghost" className={styles.actionButton} onClick={() => onEdit(contribution)}>
                  Edit
                </Button>
                <Button variant="ghost" className={styles.actionButton} onClick={() => onDelete(contribution)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default GoalContributionHistory
