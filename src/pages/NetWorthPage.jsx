import { useNavigate, Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import Skeleton from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import NetWorthCurrencySection from '../components/netWorth/NetWorthCurrencySection'
import NetWorthAccountList from '../components/netWorth/NetWorthAccountList'
import UnclassifiedAccountsNotice from '../components/netWorth/UnclassifiedAccountsNotice'
import useActionNetWorth from '../hooks/functionality/useActionNetWorth'
import styles from './NetWorthPage.module.css'

const NetWorthPage = () => {
  const navigate = useNavigate()
  const {
    isLoading,
    isError,
    refetch,
    hasAccounts,
    byCurrency,
    unknownAccounts,
    accountListEntries,
    hasInactiveAccounts,
    showInactive,
    setShowInactive,
  } = useActionNetWorth()
  const isMultiCurrency = byCurrency.length > 1

  return (
    <div>
      <PageHeader title="Net Worth" description="What you own, what you owe, and where that leaves you." />

      {isLoading && (
        <div className={styles.skeletonGrid}>
          <Skeleton height="12rem" radius="var(--radius-lg)" />
          <Skeleton height="12rem" radius="var(--radius-lg)" />
        </div>
      )}

      {!isLoading && isError && <ErrorState message="We couldn't load your net worth." onRetry={refetch} />}

      {!isLoading && !isError && !hasAccounts && (
        <EmptyState
          icon="landmark"
          title="Add your accounts to calculate net worth"
          description="Add your bank, cash, investment, or credit-card accounts to see your net worth."
          action={
            <div className={styles.emptyActions}>
              <Button onClick={() => navigate('/accounts')}>
                <Icon name="plus" size="var(--icon-sm)" />
                Add account
              </Button>
              <Button variant="ghost" onClick={() => navigate('/accounts')}>
                View accounts
              </Button>
            </div>
          }
        />
      )}

      {!isLoading && !isError && hasAccounts && (
        <>
          <UnclassifiedAccountsNotice count={unknownAccounts.length} />

          {byCurrency.length === 0 ? (
            <EmptyState
              icon="landmark"
              title="No classified accounts yet"
              description="Your accounts don't have a recognized financial type yet, so net worth can't be calculated."
              action={
                <Button variant="secondary" onClick={() => navigate('/accounts')}>
                  Review accounts
                </Button>
              }
            />
          ) : (
            <div className={styles.groups}>
              {byCurrency.map((group) => (
                <NetWorthCurrencySection key={group.currency} group={group} showCurrencyLabel={isMultiCurrency} />
              ))}
            </div>
          )}

          {isMultiCurrency && (
            <p className={`text-caption ${styles.multiCurrencyNotice}`}>
              Net worth is shown separately for each currency. No currency conversion is applied.
            </p>
          )}

          {accountListEntries.length > 0 && (
            <div className={styles.section}>
              <NetWorthAccountList
                accounts={accountListEntries}
                showInactive={showInactive}
                onToggleShowInactive={setShowInactive}
                hasInactiveAccounts={hasInactiveAccounts}
              />
            </div>
          )}

          <Card className={styles.section}>
            <h3 className="text-section-title">Related: Financial Freedom</h3>
            <p className="text-secondary">
              Net worth is your current financial position. Financial Freedom uses selected assets and spending
              assumptions to estimate a target — a different, forward-looking calculation.
            </p>
            <Link to="/financial-freedom" className={styles.link}>
              View Financial Freedom
              <Icon name="chevronRight" size="var(--icon-xs)" />
            </Link>
          </Card>

          <p className={`text-caption ${styles.footer}`}>
            Net worth is based on your current account balances, not your transaction history. Keep your account
            balances up to date for an accurate picture.
          </p>
        </>
      )}
    </div>
  )
}

export default NetWorthPage
