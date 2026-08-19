import NetWorthHero from './NetWorthHero'
import AssetBreakdown from './AssetBreakdown'
import LiabilityBreakdown from './LiabilityBreakdown'
import styles from './NetWorthCurrencySection.module.css'

// One full net worth view (hero + asset/liability breakdown) for a single
// currency's accounts. Rendered once per currency present — currencies are
// never combined or converted.
const NetWorthCurrencySection = ({ group, showCurrencyLabel }) => (
  <div className={styles.section}>
    <NetWorthHero group={group} showCurrencyLabel={showCurrencyLabel} />
    <div className={styles.breakdownGrid}>
      <AssetBreakdown group={group} />
      <LiabilityBreakdown group={group} />
    </div>
  </div>
)

export default NetWorthCurrencySection
