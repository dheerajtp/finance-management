import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/ui/PageHeader'
import Skeleton from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import AccountForm from '../components/forms/accounts/AccountForm'
import AccountCard from '../components/accounts/AccountCard'
import NetPosition from '../components/accounts/NetPosition'
import useActionAccount from '../hooks/functionality/useActionAccount'
import styles from './AccountsPage.module.css'

const AccountsPage = () => {
  const {
    accounts,
    allAccounts,
    isLoading,
    isError,
    refetch,
    showInactive,
    setShowInactive,
    isFormOpen,
    isEditing,
    openCreateForm,
    openEditForm,
    closeForm,
    register,
    errors,
    onSubmit,
    saving,
    pendingToggle,
    requestToggleActive,
    cancelToggleActive,
    confirmToggleActive,
    togglingActive,
  } = useActionAccount()

  // Group the grid by currency so balances never read as if they combine
  // across currencies — only show sub-headings when more than one is present.
  const currencies = [...new Set(accounts.map((account) => account.currency))]
  const groupByCurrency = currencies.length > 1
  const accountGroups = groupByCurrency
    ? currencies.map((currency) => ({ currency, items: accounts.filter((account) => account.currency === currency) }))
    : [{ currency: null, items: accounts }]

  return (
    <div>
      <PageHeader
        title="Accounts"
        description="Where your money currently lives."
        actions={
          <Button onClick={openCreateForm}>
            <Icon name="plus" size="var(--icon-sm)" />
            Add Account
          </Button>
        }
      />

      {/* Once loaded with zero accounts, the page's own EmptyState below
          already covers it (and its CTA opens the add-account modal
          directly) — showing NetPosition's empty state too would just
          duplicate the same message. */}
      {!isError && (isLoading || allAccounts.length > 0) && <NetPosition accounts={allAccounts} loading={isLoading} />}

      {isLoading && (
        <div className={styles.grid}>
          <Skeleton height="10rem" radius="var(--radius-lg)" />
          <Skeleton height="10rem" radius="var(--radius-lg)" />
          <Skeleton height="10rem" radius="var(--radius-lg)" />
        </div>
      )}

      {!isLoading && isError && <ErrorState message="We couldn't load your accounts." onRetry={refetch} />}

      {!isLoading && !isError && allAccounts.length === 0 && (
        <EmptyState
          icon="wallet"
          title="No accounts yet"
          description="Add your bank account, cash, credit card or investment account to start tracking your money."
          action={
            <Button onClick={openCreateForm}>
              <Icon name="plus" size="var(--icon-sm)" />
              Add Account
            </Button>
          }
        />
      )}

      {!isLoading && !isError && allAccounts.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className="text-section-title">Your Accounts</p>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(event) => setShowInactive(event.target.checked)}
              />
              Show inactive accounts
            </label>
          </div>

          {accountGroups.map((group) => (
            <div key={group.currency ?? 'all'} className={styles.currencyGroup}>
              {groupByCurrency && <p className={`text-label ${styles.currencyLabel}`}>{group.currency}</p>}
              <div className={styles.grid}>
                {group.items.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onEdit={openEditForm}
                    onToggleActive={requestToggleActive}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={isEditing ? 'Edit Account' : 'Add Account'}
        icon={isEditing ? 'pencil' : 'wallet'}
        size="sm"
      >
        <AccountForm
          register={register}
          onSubmit={onSubmit}
          errors={errors}
          saving={saving}
          submitLabel={isEditing ? 'Save changes' : 'Add account'}
        />
      </Modal>

      <ConfirmModal
        isOpen={Boolean(pendingToggle)}
        onClose={cancelToggleActive}
        onConfirm={confirmToggleActive}
        title={pendingToggle?.is_active ? 'Deactivate account?' : 'Activate account?'}
        message={
          pendingToggle?.is_active
            ? `${pendingToggle?.name} will be hidden from your active accounts. You can reactivate it anytime.`
            : `${pendingToggle?.name} will show up in your active accounts again.`
        }
        confirmLabel={pendingToggle?.is_active ? 'Deactivate' : 'Activate'}
        variant={pendingToggle?.is_active ? 'danger' : 'primary'}
        loading={togglingActive}
      />
    </div>
  )
}

export default AccountsPage
