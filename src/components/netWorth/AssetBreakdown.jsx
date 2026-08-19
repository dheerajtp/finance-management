import Card from '../ui/Card'
import Icon from '../ui/Icon'
import NetWorthAccountRow from './NetWorthAccountRow'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './AssetBreakdown.module.css'

// Only accounts that actually exist and are actually classified as assets
// (bank, cash, investment, or an 'other' account explicitly reclassified as
// an asset) — never a fabricated category.
const AssetBreakdown = ({ group }) => {
  const { currency, totalAssets, assetAccounts } = group

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <Icon name="trendingUp" size="var(--icon-sm)" className={styles.icon} />
        <h3 className="text-label">Assets</h3>
      </div>

      {assetAccounts.length === 0 ? (
        <p className="text-secondary">No asset accounts.</p>
      ) : (
        <div className={styles.list}>
          {assetAccounts.map((account) => (
            <NetWorthAccountRow key={account.id} account={account} currency={currency} total={totalAssets} tone="asset" />
          ))}
        </div>
      )}

      <div className={styles.total}>
        <p className="text-label">Total assets</p>
        <p className="text-card-title">{formatCurrency(totalAssets, currency)}</p>
      </div>
    </Card>
  )
}

export default AssetBreakdown
