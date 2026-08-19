import NetPosition from '../accounts/NetPosition'
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
    <div className={styles.wrap}>
      <NetPosition
        accounts={accounts}
        loading={loading}
        compact
        primaryCurrency={primaryCurrency}
        activeCount={activeCount}
        showDashboardLinks
      />
    </div>
  )
}

export default AccountPosition
