import Card from '../ui/Card'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './DiscretionaryReductionScenario.module.css'

const DiscretionaryReductionScenario = ({ discretionaryScenarios, currency }) => {
  return (
    <div>
      <p className="text-section-title">Discretionary Reduction Scenario</p>
      <p className="text-caption">
        Scenario only — this does not assume you can actually achieve this reduction, and never changes your actual
        transaction data.
      </p>
      <div className={styles.grid}>
        {discretionaryScenarios.map((scenario) => (
          <Card key={scenario.reductionPercent} className={styles.card}>
            <p className="text-label">{scenario.reductionPercent}% less discretionary</p>
            <p className="text-body">+{formatCurrency(scenario.savingsImprovement, currency)}/month</p>
            <p className="text-metric">
              {scenario.projection ? `~${scenario.projection.years.toFixed(1)} years` : 'Not reached in 100 years'}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default DiscretionaryReductionScenario
