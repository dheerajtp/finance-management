import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import styles from './QuickActions.module.css'

const ACTIONS = [
  { key: 'transaction', label: 'Add transaction', path: '/transactions' },
  { key: 'account', label: 'Add account', path: '/accounts' },
  { key: 'goal', label: 'Add goal', path: '/goals' },
  { key: 'budget', label: 'Add budget', path: '/budgets' },
]

// Navigates to the existing page rather than opening its form inline — no
// new flow, just a shortcut into the real one each page already owns.
const QuickActions = () => {
  const navigate = useNavigate()

  return (
    <div className={styles.row}>
      {ACTIONS.map((action) => (
        <Button key={action.key} variant="secondary" className={styles.button} onClick={() => navigate(action.path)}>
          <Icon name="plus" size="var(--icon-xs)" />
          {action.label}
        </Button>
      ))}
    </div>
  )
}

export default QuickActions
