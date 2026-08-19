import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import Skeleton from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import ProfileForm from '../components/forms/profile/ProfileForm'
import useActionProfile from '../hooks/functionality/useActionProfile'
import styles from './ProfilePage.module.css'

const ProfilePage = () => {
  const { register, onSubmit, errors, isLoading, isError, refetch, saving } = useActionProfile()

  return (
    <div className={styles.wrap}>
      <PageHeader title="Profile" description="Tell us about your financial baseline." />

      {isLoading && (
        <Card className={styles.card}>
          <div className={styles.skeletonStack}>
            <Skeleton height="2.5rem" />
            <Skeleton height="2.5rem" />
            <Skeleton height="2.5rem" />
            <Skeleton height="2.5rem" width="40%" />
          </div>
        </Card>
      )}

      {!isLoading && isError && <ErrorState message="We couldn't load your profile." onRetry={refetch} />}

      {!isLoading && !isError && (
        <ProfileForm register={register} onSubmit={onSubmit} errors={errors} saving={saving} />
      )}
    </div>
  )
}

export default ProfilePage
