import { useNavigate } from 'react-router-dom'
import Section from '../ui/Section'
import Icon from '../ui/Icon'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import styles from './FinancialActionCenter.module.css'

// Where each existing action-center id (utils/finance/actionCenter.js) leads
// when clicked — routing only, the actions themselves are unchanged.
const ACTION_ROUTE = {
  no_transactions: '/transactions',
  no_income: '/transactions',
  recurring_overdue: '/recurring-transactions',
  recurring_due: '/recurring-transactions',
  no_emergency_fund: '/emergency-fund',
  budget_attention: '/budgets',
  below_target: '/profile',
  low_savings_rate: '/profile',
  high_discretionary: '/spending-analysis',
  uncategorized: '/spending-analysis',
  goals_behind: '/goals',
}

// Deterministic — the rule evaluation and 3-item cap live in
// utils/finance/actionCenter.js. This component only renders the result.
const FinancialActionCenter = ({ actions, hasTransactions, onAddTransaction }) => {
  const navigate = useNavigate()

  return (
    <Section title="Financial Action Center">
      {actions.length === 0 && !hasTransactions && (
        <EmptyState
          icon="list"
          title="Add your first transaction"
          description="Your dashboard will become more useful once you begin tracking income and expenses."
          action={
            <Button onClick={onAddTransaction}>
              <Icon name="plus" size="var(--icon-sm)" />
              Add transaction
            </Button>
          }
          className={styles.empty}
        />
      )}

      {actions.length === 0 && hasTransactions && (
        <p className={`text-secondary ${styles.allClear}`}>You&rsquo;re all set.</p>
      )}

      {actions.length > 0 && (
        <div className={styles.list}>
          {actions.map((action) => {
            const route = ACTION_ROUTE[action.id]
            return (
              <button
                key={action.id}
                type="button"
                className={styles.item}
                onClick={route ? () => navigate(route) : undefined}
                disabled={!route}
              >
                <span className={styles.message}>{action.message}</span>
                {route && <Icon name="chevronRight" size="var(--icon-sm)" className={styles.arrow} />}
              </button>
            )
          })}
        </div>
      )}
    </Section>
  )
}

export default FinancialActionCenter
