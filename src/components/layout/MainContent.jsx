import styles from './MainContent.module.css'

const MainContent = ({ children }) => {
  return (
    <main className={styles.main}>
      <div className={styles.inner}>{children}</div>
    </main>
  )
}

export default MainContent
