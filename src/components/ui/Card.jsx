import styles from './Card.module.css'

const VARIANT_CLASSES = {
  elevated: 'elevated',
  interactive: 'interactive',
  hero: 'hero',
  flat: 'flat',
}

const Card = ({ children, variant = 'default', className = '', as: Tag = 'div', ...props }) => {
  const variantClass = styles[VARIANT_CLASSES[variant]] ?? ''

  return (
    <Tag className={`${styles.card} ${variantClass} ${className}`} {...props}>
      {children}
    </Tag>
  )
}

export default Card
