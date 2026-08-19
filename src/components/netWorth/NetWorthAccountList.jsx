import Card from '../ui/Card'
import Badge from '../ui/Badge'
import IconBox from '../ui/IconBox'
import { ACCOUNT_TYPE_MAP, ACCOUNT_TYPE_ICON } from '../../constants/accountTypes'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './NetWorthAccountList.module.css'

const CLASSIFICATION_LABEL = { asset: 'Asset', liability: 'Liability', unknown: 'Unclassified' }
const CLASSIFICATION_VARIANT = { asset: 'success', liability: 'warning', unknown: 'neutral' }

// The full account composition behind the totals above — every account
// included in net worth, one row each. Inactive accounts only appear when
// explicitly requested (transparency only; they never affect any total).
const NetWorthAccountList = ({ accounts, showInactive, onToggleShowInactive, hasInactiveAccounts }) => (
  <Card className={styles.card}>
    <div className={styles.header}>
      <h3 className="text-section-title">Account Composition</h3>
      {hasInactiveAccounts && (
        <label className={styles.toggle}>
          <input type="checkbox" checked={showInactive} onChange={(event) => onToggleShowInactive(event.target.checked)} />
          Show inactive accounts
        </label>
      )}
    </div>

    <div className={styles.list}>
      {accounts.map((account) => (
        <div key={account.id} className={`${styles.row} ${account.is_active ? '' : styles.inactiveRow}`}>
          <IconBox icon={ACCOUNT_TYPE_ICON[account.type] ?? 'wallet'} accent="muted" size="sm" />
          <div className={styles.identity}>
            <p className="text-card-title">{account.name}</p>
            <p className="text-caption">{ACCOUNT_TYPE_MAP[account.type]?.label ?? account.type}</p>
          </div>
          <div className={styles.trailing}>
            <p className="text-body">
              {formatCurrency(account.balance, account.currency)}
              {account.classification === 'liability' ? ' owed' : ''}
            </p>
            <div className={styles.badges}>
              {!account.is_active && <Badge variant="neutral">Inactive</Badge>}
              <Badge variant={CLASSIFICATION_VARIANT[account.classification] ?? 'neutral'}>
                {CLASSIFICATION_LABEL[account.classification] ?? account.classification}
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  </Card>
)

export default NetWorthAccountList
