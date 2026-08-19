import { Link, useNavigate } from 'react-router-dom'
import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import Skeleton from '../ui/Skeleton'
import { summarizeAccounts } from '../../utils/finance/accountSummary'
import { formatCurrency } from '../../utils/finance/currency'
import Sparkline from '../ui/Sparkline'
import styles from './NetPosition.module.css'

// The hero "how am I doing overall" panel — assets minus liabilities, i.e.
// net worth (see utils/finance/netWorth.js, the dedicated /net-worth
// feature's calculations) — replaces showing assets, liabilities and net
// worth as three identical StatCards. Reused on both the dashboard and the
// Accounts page so the number reads the same everywhere.
//
// `compact` + `primaryCurrency` are for the dashboard specifically: instead
// of stacking a full card per currency (right for /accounts and
// /net-worth, where the user is reviewing accounts in depth), it shows only
// the profile-currency group plus a "+N other currencies" note — never
// combining them, just not spending dashboard space on every one.
const NetPosition = ({ accounts, loading, compact = false, primaryCurrency, activeCount, showDashboardLinks = false }) => {
  const navigate = useNavigate()

  if (loading) {
    return (
      <Card variant="hero" className={styles.card}>
        <Skeleton width="35%" height="0.75rem" />
        <Skeleton width="55%" height="2.5rem" />
        <Skeleton width="70%" height="1rem" />
      </Card>
    )
  }

  const groups = summarizeAccounts(accounts)

  if (groups.length === 0) {
    return (
      <Card variant="hero" className={styles.card}>
        <EmptyState
          icon="wallet"
          title="No accounts added yet"
          description="Add your first account to start tracking your financial position."
          action={
            <Button onClick={() => navigate('/accounts')}>
              <Icon name="plus" size="var(--icon-sm)" />
              Add account
            </Button>
          }
        />
      </Card>
    )
  }

  const primaryGroup = compact ? (groups.find((group) => group.currency === primaryCurrency) ?? groups[0]) : null
  const otherGroupCount = compact ? groups.length - 1 : 0
  const visibleGroups = compact ? [primaryGroup] : groups

  return (
    <div className={styles.stack}>
      {visibleGroups.map((group) => (
        <Card key={group.currency} variant="hero" className={styles.card}>
          <div className={styles.headerRow}>
            <div className={styles.headerText}>
              <p className="text-label">Net Worth{groups.length > 1 && !compact ? ` — ${group.currency}` : ''}</p>
              <p className={`text-hero-metric ${styles.value}`}>{formatCurrency(group.netPosition, group.currency)}</p>
              <span className={`text-delta ${group.netPosition >= 0 ? 'text-delta--up' : 'text-delta--down'}`}>
                {group.netPosition >= 0 ? 'Positive' : 'Negative'}
              </span>
            </div>
            {compact && <Sparkline data={[]} width={120} height={48} />}
          </div>

          <div className={styles.split}>
            <div>
              <p className="text-label">Assets</p>
              <p className="text-card-title">{formatCurrency(group.totalAssets, group.currency)}</p>
            </div>
            <div>
              <p className="text-label">Liabilities</p>
              <p className="text-card-title">{formatCurrency(group.totalLiabilities, group.currency)}</p>
            </div>
          </div>

          {compact && showDashboardLinks && typeof activeCount === 'number' && (
            <>
              <p className={`text-caption ${styles.count}`}>{activeCount} active account{activeCount === 1 ? '' : 's'}</p>
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

          {compact && otherGroupCount > 0 && (
            <p className={`text-caption ${styles.otherCurrencies}`} style={{ marginTop: '8px' }}>
              + {otherGroupCount} other currenc{otherGroupCount === 1 ? 'y' : 'ies'} (not combined)
            </p>
          )}
        </Card>
      ))}

      {!compact && otherGroupCount > 0 && (
        <p className={`text-caption ${styles.otherCurrencies}`}>
          + {otherGroupCount} other currenc{otherGroupCount === 1 ? 'y' : 'ies'} (not combined)
        </p>
      )}
    </div>
  )
}

export default NetPosition
