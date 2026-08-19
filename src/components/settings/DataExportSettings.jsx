import Button from '../ui/Button'
import Icon from '../ui/Icon'

// Builds and downloads a JSON export from data already fetched through the
// normal RLS-scoped query hooks — see useActionSettings. No new API surface.
const DataExportSettings = ({ onExport, exporting, loading }) => (
  <div>
    <p className="text-secondary">
      Download a JSON copy of your accounts, categories, transactions, goals, budgets, and emergency-fund /
      financial-freedom settings.
    </p>
    <Button variant="secondary" onClick={onExport} loading={exporting} disabled={loading}>
      <Icon name="download" size="var(--icon-sm)" />
      Export my data
    </Button>
  </div>
)

export default DataExportSettings
