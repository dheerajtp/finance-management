import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import EmptyState from '../ui/EmptyState'
import InvestmentPlanCard from './InvestmentPlanCard'
import InvestmentPlanForm from '../forms/investments/InvestmentPlanForm'
import InvestmentContributionForm from '../forms/investments/InvestmentContributionForm'
import useActionInvestmentPlan from '../../hooks/functionality/useActionInvestmentPlan'
import useActionInvestmentContribution from '../../hooks/functionality/useActionInvestmentContribution'
import styles from './InvestmentHoldingManageModal.module.css'

// Self-contained: given one holding, owns everything about its SIP(s) —
// add/edit plan, pause/resume, and recording or skipping a contribution.
// Nothing here ever touches the holding's own invested_amount/current_value
// (see task notes); those stay edited directly on the holding.
const InvestmentHoldingManageModal = ({ holding, onClose }) => {
  const {
    holdingPlans,
    isFormOpen: isPlanFormOpen,
    isEditing: isEditingPlan,
    openCreateForm: openCreatePlanForm,
    openEditForm: openEditPlanForm,
    closeForm: closePlanForm,
    register: registerPlan,
    errors: planErrors,
    watchedFrequency,
    onSubmit: onSubmitPlan,
    saving: savingPlan,
    pausePlan,
    resumePlan,
  } = useActionInvestmentPlan(holding)

  const {
    isFormOpen: isContributionFormOpen,
    isEditing: isEditingContribution,
    openAddForm: openAddContributionForm,
    openSkipForm,
    closeForm: closeContributionForm,
    register: registerContribution,
    errors: contributionErrors,
    onSubmit: onSubmitContribution,
    saving: savingContribution,
  } = useActionInvestmentContribution(holding)

  return (
    <Modal isOpen={Boolean(holding)} onClose={onClose} title={`Manage SIP — ${holding?.name ?? ''}`} icon="calendarCheck" size="md">
      {holding && (
        <div className={styles.wrap}>
          <div className={styles.head}>
            <p className="text-secondary">Recurring contributions toward this investment.</p>
            <Button variant="secondary" onClick={openCreatePlanForm}>
              <Icon name="plus" size="var(--icon-sm)" />
              Add SIP
            </Button>
          </div>

          {holdingPlans.length === 0 ? (
            <EmptyState
              icon="calendarCheck"
              title="No SIP set up yet"
              description="Add a recurring contribution plan for this investment, or keep tracking it manually."
              action={<Button onClick={openCreatePlanForm}>Add SIP</Button>}
            />
          ) : (
            <div className={styles.planList}>
              {holdingPlans.map((plan) => (
                <InvestmentPlanCard
                  key={plan.id}
                  plan={plan}
                  holdingName={holding.name}
                  onRecord={openAddContributionForm}
                  onSkip={openSkipForm}
                  onEdit={openEditPlanForm}
                  onPause={pausePlan}
                  onResume={resumePlan}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isPlanFormOpen}
        onClose={closePlanForm}
        title={isEditingPlan ? 'Edit SIP' : 'Add SIP'}
        icon={isEditingPlan ? 'pencil' : 'calendarCheck'}
        size="sm"
      >
        <InvestmentPlanForm
          register={registerPlan}
          onSubmit={onSubmitPlan}
          errors={planErrors}
          saving={savingPlan}
          watchedFrequency={watchedFrequency}
          submitLabel={isEditingPlan ? 'Save changes' : 'Add SIP'}
        />
      </Modal>

      <Modal
        isOpen={isContributionFormOpen}
        onClose={closeContributionForm}
        title={isEditingContribution ? 'Edit Contribution' : 'Record Contribution'}
        icon={isEditingContribution ? 'pencil' : 'chartCandlestick'}
        size="sm"
      >
        <InvestmentContributionForm
          register={registerContribution}
          onSubmit={onSubmitContribution}
          errors={contributionErrors}
          saving={savingContribution}
          isEditing={isEditingContribution}
          submitLabel={isEditingContribution ? 'Save changes' : 'Save'}
        />
      </Modal>
    </Modal>
  )
}

export default InvestmentHoldingManageModal
