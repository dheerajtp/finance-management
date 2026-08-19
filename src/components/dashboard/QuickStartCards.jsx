import { useNavigate } from 'react-router-dom'
import Card from '../ui/Card'
import IconBox from '../ui/IconBox'
import Icon from '../ui/Icon'
import styles from './QuickStartCards.module.css'

// "done" reflects real setup state passed down from useActionDashboard.
// The financial-plan card has no single completion signal, so it never
// shows a checkmark.
const ITEMS = ({ hasAccounts, hasTransactions, profileComplete }) => [
  {
    key: 'account',
    title: 'Add your first account',
    description: 'Add a bank, cash, credit card, or investment account.',
    cta: 'Add account',
    path: '/accounts',
    icon: 'wallet',
    accent: 'info',
    done: hasAccounts,
  },
  {
    key: 'transaction',
    title: 'Add your first transaction',
    description: 'Start tracking income and expenses.',
    cta: 'Add transaction',
    path: '/transactions',
    icon: 'list',
    accent: 'success',
    done: hasTransactions,
  },
  {
    key: 'profile',
    title: 'Complete your profile',
    description: 'Set your currency and monthly savings target.',
    cta: 'Complete profile',
    path: '/profile',
    icon: 'user',
    accent: 'purple',
    done: profileComplete,
  },
  {
    key: 'plan',
    title: 'Set up your financial plan',
    description: 'Explore goals, budgets, emergency fund, and financial freedom.',
    cta: 'Explore planning',
    path: '/emergency-fund',
    icon: 'compass',
    accent: 'warning',
    done: false,
  },
]

const QuickStartCards = ({ hasAccounts, hasTransactions, profileComplete }) => {
  const navigate = useNavigate()
  const items = ITEMS({ hasAccounts, hasTransactions, profileComplete })

  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <Card
          key={item.key}
          as="button"
          type="button"
          variant="interactive"
          className={styles.card}
          onClick={() => navigate(item.path)}
        >
          <div className={styles.header}>
            <IconBox icon={item.icon} accent={item.accent} size="lg" />
            {item.done && <Icon name="checkCircle" size="var(--icon-sm)" className={styles.doneIcon} />}
          </div>
          <p className="text-card-title">{item.title}</p>
          <p className="text-caption">{item.description}</p>
          <span className={styles.cta}>
            {item.cta}
            <Icon name="chevronRight" size="var(--icon-xs)" />
          </span>
        </Card>
      ))}
    </div>
  )
}

export default QuickStartCards
