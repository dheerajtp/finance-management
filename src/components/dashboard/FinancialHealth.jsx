import { useNavigate } from 'react-router-dom'
import Section from '../ui/Section'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Skeleton from '../ui/Skeleton'
import ErrorState from '../ui/ErrorState'
import EmptyState from '../ui/EmptyState'
import FinancialHealthItem from './FinancialHealthItem'
import FinancialHealthPriorities from './FinancialHealthPriorities'
import styles from './FinancialHealth.module.css'

const AREA_ICON = {
  emergency_fund: 'shield',
  investments: 'chartCandlestick',
  savings: 'wallet',
  spending: 'barChart',
  budgets: 'target',
  goals: 'flag',
  financial_freedom: 'compass',
}

const AREA_ROUTE = {
  emergency_fund: '/emergency-fund',
  investments: '/investments',
  savings: '/profile',
  spending: '/spending-analysis',
  budgets: '/budgets',
  goals: '/goals',
  financial_freedom: '/financial-freedom',
}

const OVERALL_LABEL = { needs_attention: 'Needs attention', in_progress: 'In progress', on_track: 'On track', not_configured: 'Not configured' }
const OVERALL_VARIANT = { needs_attention: 'warning', in_progress: 'info', on_track: 'success', not_configured: 'neutral' }

// "How does my current activity compare with my own configured plans?" —
// an observation layer, never a score. Every status/message it renders was
// already derived by useActionFinancialHealth from existing feature data;
// this component only lays it out.
const FinancialHealth = ({ isLoading, isError, refetch, areas, priorities, isConfigured, overallStatus }) => {
  const navigate = useNavigate()

  const badge = overallStatus && (
    <Badge variant={OVERALL_VARIANT[overallStatus] ?? 'neutral'}>{OVERALL_LABEL[overallStatus] ?? overallStatus}</Badge>
  )

  if (isLoading) {
    return (
      <Section title="Financial Health" description="How your current activity compares with your plans.">
        <div className={styles.skeletonList}>
          {[0, 1, 2, 3, 4].map((key) => (
            <Skeleton key={key} height="2.25rem" radius="var(--radius-md)" />
          ))}
        </div>
      </Section>
    )
  }

  if (isError) {
    return (
      <Section title="Financial Health">
        <ErrorState message="Financial health information is temporarily unavailable." onRetry={refetch} />
      </Section>
    )
  }

  if (!isConfigured) {
    return (
      <Section title="Financial Health">
        <EmptyState
          icon="compass"
          title="Set up your financial plans"
          description="Configure an emergency fund, savings target, or investment plan to start tracking progress against your own goals."
          action={
            <div className={styles.emptyActions}>
              <Button variant="secondary" onClick={() => navigate('/profile')}>
                Set savings target
              </Button>
              <Button variant="secondary" onClick={() => navigate('/emergency-fund')}>
                Set up emergency fund
              </Button>
              <Button variant="secondary" onClick={() => navigate('/investments')}>
                Add an investment
              </Button>
            </div>
          }
        />
      </Section>
    )
  }

  return (
    <Section title="Financial Health" description="How your current activity compares with your plans." actions={badge}>
      <div className={styles.list}>
        {areas.map((area) => (
          <FinancialHealthItem key={area.area} icon={AREA_ICON[area.area]} route={AREA_ROUTE[area.area]} area={area} />
        ))}
      </div>

      <FinancialHealthPriorities priorities={priorities} />
    </Section>
  )
}

export default FinancialHealth
