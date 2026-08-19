import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import IconBox from '../ui/IconBox'
import { getCategoryIcon } from '../../constants/categoryIcons'
import styles from './CategoryCard.module.css'

const CategoryCard = ({ category, onEdit, onToggleActive }) => {
  const typeLabel =
    category.type === 'expense' ? (category.is_essential ? 'Essential' : 'Discretionary') : 'Income'

  return (
    <Card className={styles.card}>
      <IconBox icon={getCategoryIcon(category)} accent="muted" size="sm" />

      <p className={`text-body ${styles.name}`}>{category.name}</p>

      <div className={styles.badges}>
        <Badge variant="info">{typeLabel}</Badge>
        {category.is_system && <Badge variant="neutral">Default</Badge>}
        <Badge variant={category.is_active ? 'success' : 'neutral'}>
          {category.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div className={styles.actions}>
        <Button variant="ghost" onClick={() => onEdit(category)}>
          Edit
        </Button>
        <Button variant="ghost" onClick={() => onToggleActive(category)}>
          {category.is_active ? 'Archive' : 'Restore'}
        </Button>
      </div>
    </Card>
  )
}

export default CategoryCard
