import AppRouter from './routes/AppRouter'
import useThemeSync from './hooks/common/useThemeSync'

function App() {
  useThemeSync()
  return <AppRouter />
}

export default App
