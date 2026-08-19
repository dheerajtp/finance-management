import IconBox from '../ui/IconBox'
import Progress from '../ui/Progress'
import { ACCOUNT_TYPE_MAP, ACCOUNT_TYPE_ICON } from '../../constants/accountTypes'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './NetWorthAccountRow.module.css'

// Shared by AssetBreakdown and LiabilityBreakdown — one account's row,
// with a progress bar showing its share of that column's own total (which
// accounts make up most of your assets/liabilities, not decoration).
const NetWorthAccountRow = ({ account, currency, total, tone }) => {
  const typeInfo = ACCOUNT_TYPE_MAP[account.type]
  const amount = Number(account.balance) || 0
  const percentage = total > 0 ? (amount / total) * 100 : 0

  return (
    <div className={styles.row}>
      <div className={styles.rowHeader}>
        <IconBox icon={ACCOUNT_TYPE_ICON[account.type] ?? 'wallet'} accent="muted" size="sm" />
        <div className={styles.identity}>
          <p className="text-card-title">{account.name}</p>
          <p className="text-caption">{typeInfo?.label ?? account.type}</p>
        </div>
        <p className={`text-metric ${styles.amount}`}>{formatCurrency(amount, currency)}</p>
      </div>
      <Progress percentage={percentage} state={tone === 'liability' ? 'danger' : 'default'} />
    </div>
  )
}

export default NetWorthAccountRow
