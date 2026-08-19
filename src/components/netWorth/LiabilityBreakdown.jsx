import Card from '../ui/Card'
import Icon from '../ui/Icon'
import NetWorthAccountRow from './NetWorthAccountRow'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './LiabilityBreakdown.module.css'

// Only accounts that actually exist and are actually classified as
// liabilities (credit_card, or an 'other' account explicitly reclassified
// as a liability) — never a fabricated category, and the stored balance is
// used exactly as-is (already a positive "amount owed", never negated).
const LiabilityBreakdown = ({ group }) => {
  const { currency, totalLiabilities, liabilityAccounts } = group

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <Icon name="creditCard" size="var(--icon-sm)" className={styles.icon} />
        <h3 className="text-label">Liabilities</h3>
      </div>

      {liabilityAccounts.length === 0 ? (
        <p className="text-secondary">No liability accounts.</p>
      ) : (
        <div className={styles.list}>
          {liabilityAccounts.map((account) => (
            <NetWorthAccountRow
              key={account.id}
              account={account}
              currency={currency}
              total={totalLiabilities}
              tone="liability"
            />
          ))}
        </div>
      )}

      <div className={styles.total}>
        <p className="text-label">Total liabilities</p>
        <p className="text-card-title">{formatCurrency(totalLiabilities, currency)}</p>
      </div>
    </Card>
  )
}

export default LiabilityBreakdown
