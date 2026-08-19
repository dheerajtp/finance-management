import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/ui/PageHeader'
import Skeleton from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import InvestmentOverview from '../components/investments/InvestmentOverview'
import InvestmentHoldings from '../components/investments/InvestmentHoldings'
import InvestmentHoldingManageModal from '../components/investments/InvestmentHoldingManageModal'
import InvestmentPlanCard from '../components/investments/InvestmentPlanCard'
import UpcomingInvestmentContributions from '../components/investments/UpcomingInvestmentContributions'
import InvestmentContributionList from '../components/investments/InvestmentContributionList'
import InvestmentHoldingForm from '../components/forms/investments/InvestmentHoldingForm'
import InvestmentContributionForm from '../components/forms/investments/InvestmentContributionForm'
import useActionInvestments from '../hooks/functionality/useActionInvestments'
import useActionInvestmentPlan from '../hooks/functionality/useActionInvestmentPlan'
import useActionInvestmentContribution from '../hooks/functionality/useActionInvestmentContribution'
import styles from './InvestmentsPage.module.css'

const InvestmentsPage = () => {
  const {
    holdings,
    allHoldings,
    overviewByCurrency,
    isLoading,
    isError,
    refetch,
    currencyFilter,
    setCurrencyFilter,
    currencyOptions,
    typeFilter,
    setTypeFilter,
    showInactive,
    setShowInactive,
    search,
    setSearch,
    sortBy,
    setSortBy,
    isFormOpen,
    isEditing,
    openCreateForm,
    openEditForm,
    closeForm,
    register,
    errors,
    investmentAccountOptions,
    onSubmit,
    saving,
    pendingToggle,
    requestToggleActive,
    cancelToggleActive,
    confirmToggleActive,
    togglingActive,
    manageSipHolding,
    requestManageSip,
    closeManageSip,
  } = useActionInvestments()

  // Page-wide view across every holding's SIP(s) — pause/resume act
  // directly, while record/skip/edit deep-link into the same per-holding
  // "Manage SIP" modal used from the holdings grid (see
  // InvestmentHoldingManageModal), rather than duplicating that flow here.
  const { plans, pausePlan, resumePlan } = useActionInvestmentPlan()
  const activePlans = plans.filter((plan) => plan.is_active)
  const upcomingPlans = activePlans
    .filter((plan) => plan.status === 'due' || plan.status === 'overdue')
    .sort((a, b) => a.daysUntil - b.daysUntil)
  const holdingsById = Object.fromEntries(allHoldings.map((holding) => [holding.id, holding]))
  const manageSipForPlan = (plan) => requestManageSip(holdingsById[plan.holding_id])

  const {
    contributions,
    isLoading: contributionsLoading,
    openEditForm: openEditContribution,
    isFormOpen: isContributionFormOpen,
    isEditing: isEditingContribution,
    closeForm: closeContributionForm,
    register: registerContribution,
    errors: contributionErrors,
    onSubmit: onSubmitContribution,
    saving: savingContribution,
    pendingDelete,
    requestDelete,
    cancelDelete,
    confirmDelete,
    deleting,
  } = useActionInvestmentContribution()

  const recentContributions = contributions
    .slice()
    .sort((a, b) => (a.contribution_date < b.contribution_date ? 1 : -1))
    .slice(0, 10)

  return (
    <div className={styles.page}>
      <PageHeader
        title="Investments"
        description="What you've invested, what it's worth, and what's due next — never combined across currencies."
        actions={
          <Button onClick={openCreateForm}>
            <Icon name="plus" size="var(--icon-sm)" />
            Add Investment
          </Button>
        }
      />

      {isLoading && (
        <div className={styles.grid}>
          <Skeleton height="96px" radius="var(--radius-lg)" />
          <Skeleton height="96px" radius="var(--radius-lg)" />
          <Skeleton height="96px" radius="var(--radius-lg)" />
          <Skeleton height="96px" radius="var(--radius-lg)" />
        </div>
      )}

      {!isLoading && isError && <ErrorState message="We couldn't load your investments." onRetry={refetch} />}

      {!isLoading && !isError && (
        <>
          <InvestmentOverview overviewByCurrency={overviewByCurrency} loading={false} />

          <div className={styles.section}>
            <InvestmentHoldings
              holdings={holdings}
              hasAnyHoldings={allHoldings.length > 0}
              currencyFilter={currencyFilter}
              setCurrencyFilter={setCurrencyFilter}
              currencyOptions={currencyOptions}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              showInactive={showInactive}
              setShowInactive={setShowInactive}
              search={search}
              setSearch={setSearch}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onAddHolding={openCreateForm}
              onEdit={openEditForm}
              onManageSip={requestManageSip}
              onToggleActive={requestToggleActive}
            />
          </div>

          <div className={styles.columns}>
            <Card className={styles.columnCard}>
              <div className={styles.sectionHeader}>
                <h2 className="text-section-title">Active SIPs</h2>
                <span className={styles.countBadge}>{activePlans.length}</span>
              </div>
              {activePlans.length === 0 ? (
                <div className={styles.emptyCompact}>
                  <EmptyState icon="calendarCheck" title="No active SIPs" description="Set up a recurring contribution from any investment's Manage SIP screen." />
                </div>
              ) : (
                <div className={styles.planList}>
                  {activePlans.map((plan) => (
                    <InvestmentPlanCard
                      key={plan.id}
                      plan={plan}
                      holdingName={holdingsById[plan.holding_id]?.name ?? 'Unknown investment'}
                      onRecord={manageSipForPlan}
                      onSkip={manageSipForPlan}
                      onEdit={manageSipForPlan}
                      onPause={pausePlan}
                      onResume={resumePlan}
                    />
                  ))}
                </div>
              )}
            </Card>

            <UpcomingInvestmentContributions plans={upcomingPlans} />
          </div>

          <Card>
            <div className={styles.sectionHeader}>
              <h2 className="text-section-title">Recent Contributions</h2>
              <span className={styles.countBadge}>{recentContributions.length}</span>
            </div>
            {!contributionsLoading && recentContributions.length === 0 ? (
              <div className={styles.emptyCompact}>
                <EmptyState icon="chartCandlestick" title="Nothing recorded yet" description="Contributions you record or skip from a SIP will show up here." />
              </div>
            ) : (
              <InvestmentContributionList contributions={recentContributions} onEdit={openEditContribution} onDelete={requestDelete} />
            )}
          </Card>
        </>
      )}

      <Modal isOpen={isFormOpen} onClose={closeForm} title={isEditing ? 'Edit Investment' : 'Add Investment'} icon={isEditing ? 'pencil' : 'chartCandlestick'} size="sm">
        <InvestmentHoldingForm
          register={register}
          onSubmit={onSubmit}
          errors={errors}
          saving={saving}
          accountOptions={investmentAccountOptions}
          submitLabel={isEditing ? 'Save changes' : 'Add investment'}
        />
      </Modal>

      <InvestmentHoldingManageModal holding={manageSipHolding} onClose={closeManageSip} />

      <Modal
        isOpen={isContributionFormOpen}
        onClose={closeContributionForm}
        title={isEditingContribution ? 'Edit Contribution' : 'Record Contribution'}
        icon="pencil"
        size="sm"
      >
        <InvestmentContributionForm
          register={registerContribution}
          onSubmit={onSubmitContribution}
          errors={contributionErrors}
          saving={savingContribution}
          isEditing={isEditingContribution}
          submitLabel="Save changes"
        />
      </Modal>

      <ConfirmModal
        isOpen={Boolean(pendingDelete)}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete contribution?"
        message="This removes the recorded contribution. It never changes the investment's invested amount or current value — update those directly if needed."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />

      <ConfirmModal
        isOpen={Boolean(pendingToggle)}
        onClose={cancelToggleActive}
        onConfirm={confirmToggleActive}
        title={pendingToggle?.is_active ? 'Deactivate investment?' : 'Activate investment?'}
        message={
          pendingToggle?.is_active
            ? `${pendingToggle?.name} will be hidden from your active investments. You can reactivate it anytime.`
            : `${pendingToggle?.name} will show up in your active investments again.`
        }
        confirmLabel={pendingToggle?.is_active ? 'Deactivate' : 'Activate'}
        variant={pendingToggle?.is_active ? 'danger' : 'primary'}
        loading={togglingActive}
      />
    </div>
  )
}

export default InvestmentsPage
