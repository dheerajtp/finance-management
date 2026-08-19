import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import IconBox from '../ui/IconBox'
import { ACCOUNT_TYPE_MAP, ACCOUNT_TYPE_ICON } from '../../constants/accountTypes'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './AccountCard.module.css'

const AccountCard = ({ account, onEdit, onToggleActive }) => {
  const typeInfo = ACCOUNT_TYPE_MAP[account.type]
  const isLiability = typeInfo?.classification === 'liability'

  return (
    <Card variant="elevated" className={styles.card}>
      <div className={styles.header}>
        <div className={styles.identity}>
          <IconBox icon={ACCOUNT_TYPE_ICON[account.type] ?? 'wallet'} accent="muted" size="sm" />
          <div>
            <p className="text-card-title">{account.name}</p>
            <p className="text-caption">{typeInfo?.label ?? account.type}</p>
          </div>
        </div>
        <Badge variant={account.is_active ? 'success' : 'neutral'}>{account.is_active ? 'Active' : 'Inactive'}</Badge>
      </div>

      <div className={styles.balanceRow}>
        <p className={`text-metric ${styles.balance}`}>{formatCurrency(account.balance, account.currency)}</p>
        <p className="text-caption">{isLiability ? 'Amount owed' : account.currency}</p>
      </div>

      <div className={styles.actions}>
        <Button variant="ghost" onClick={() => onEdit(account)}>
          Edit
        </Button>
        <Button variant="ghost" onClick={() => onToggleActive(account)}>
          {account.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </Card>
  )
}

export default AccountCard
