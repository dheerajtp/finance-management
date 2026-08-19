import { Link } from 'react-router-dom'
import NetPosition from '../accounts/NetPosition'
import Icon from '../ui/Icon'
import styles from './AccountPosition.module.css'

// Thin dashboard-context wrapper — all the actual assets/liabilities/net
// worth calculation lives in utils/finance/accountSummary.js via
// NetPosition, reused as-is rather than duplicated here. `compact` shows
// only the profile-currency net worth (+ a "N other currencies" note)
// instead of stacking every currency's full card, keeping this dashboard
// section thin — the full breakdown lives on /net-worth.
const AccountPosition = ({ accounts, loading, primaryCurrency }) => {
  const activeCount = accounts.filter((account) => account.is_active).length

  return (
    <div>
      <NetPosition accounts={accounts} loading={loading} compact primaryCurrency={primaryCurrency} />
      {!loading && (
        <>
          <p className={`text-caption ${styles.count}`}>
            {activeCount} active account{activeCount === 1 ? '' : 's'}
          </p>
          <div className={styles.links}>
            <Link to="/accounts" className={styles.viewAll}>
              View all accounts
              <Icon name="chevronRight" size="var(--icon-xs)" />
            </Link>
            <Link to="/net-worth" className={styles.viewAll}>
              View net worth
              <Icon name="chevronRight" size="var(--icon-xs)" />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default AccountPosition
