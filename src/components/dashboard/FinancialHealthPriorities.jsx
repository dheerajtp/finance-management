import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import styles from './FinancialHealthPriorities.module.css'

const AREA_ROUTE = {
  emergency_fund: '/emergency-fund',
  investments: '/investments',
  savings: '/profile',
  spending: '/spending-analysis',
  budgets: '/budgets',
  goals: '/goals',
  financial_freedom: '/financial-freedom',
}

// "Worth reviewing," not "do this or else" — max 3 items, fixed order, both
// enforced by getFinancialHealthPriorities (utils/finance/financialHealth.js).
// This component only renders the result and links each item to the
// existing page that owns it.
const FinancialHealthPriorities = ({ priorities }) => {
  if (priorities.length === 0) return null

  return (
    <div className={styles.wrap}>
      <p className={`text-label ${styles.heading}`}>Needs your attention</p>
      <ol className={styles.list}>
        {priorities.map((priority) => {
          const route = AREA_ROUTE[priority.area]
          const content = (
            <>
              <span className={styles.message}>{priority.message}</span>
              {route && <Icon name="chevronRight" size="var(--icon-sm)" className={styles.arrow} />}
            </>
          )
          return (
            <li key={priority.area}>
              {route ? (
                <Link to={route} className={styles.item}>
                  {content}
                </Link>
              ) : (
                <span className={styles.item}>{content}</span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default FinancialHealthPriorities
