import Card from '../ui/Card'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import styles from './SpendingInsights.module.css'

const BADGE_VARIANT = { warning: 'warning', info: 'info', neutral: 'neutral' }
const SEVERITY_LABEL = { warning: 'Needs attention', info: 'Pattern', neutral: 'Awareness' }

const SpendingInsights = ({ insights, hasSufficientHistory }) => {
  return (
    <Card variant="flat" className={styles.card}>
      <p className="text-section-title">Needs Attention</p>

      {insights.length === 0 ? (
        <EmptyState
          title="Nothing needs attention right now"
          description={
            hasSufficientHistory
              ? 'Your spending is within its recent pattern.'
              : 'More history is needed to identify spending patterns.'
          }
          className={styles.empty}
        />
      ) : (
        <ul className={styles.list}>
          {insights.map((insight) => (
            <li
              key={`${insight.type}-${insight.categoryId ?? 'general'}`}
              className={`${styles.item} ${styles[insight.severity] ?? ''}`}
            >
              <div className={styles.header}>
                <p className="text-card-title">{insight.title}</p>
                <Badge variant={BADGE_VARIANT[insight.severity] ?? 'neutral'}>{SEVERITY_LABEL[insight.severity]}</Badge>
              </div>
              <p className="text-secondary">{insight.message}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default SpendingInsights
