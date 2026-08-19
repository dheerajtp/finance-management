import Card from '../ui/Card'
import styles from './FinancialFreedomInsight.module.css'

const FinancialFreedomInsight = ({ insights }) => {
  if (insights.length === 0) return null

  return (
    <Card variant="flat">
      <p className="text-section-title">Insights</p>
      <ul className={styles.list}>
        {insights.map((message) => (
          <li key={message} className={styles.item}>
            {message}
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default FinancialFreedomInsight
