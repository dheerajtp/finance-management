import styles from './Skeleton.module.css'

const Skeleton = ({ width = '100%', height = '1rem', radius, className = '' }) => {
  return (
    <span
      className={`${styles.skeleton} ${className}`}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  )
}

export default Skeleton
