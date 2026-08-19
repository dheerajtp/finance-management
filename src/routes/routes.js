import HomePage from '../pages/HomePage'
import ProfilePage from '../pages/ProfilePage'
import AccountsPage from '../pages/AccountsPage'
import CategoriesPage from '../pages/CategoriesPage'
import TransactionsPage from '../pages/TransactionsPage'
import SubscriptionsPage from '../pages/SubscriptionsPage'
import RecurringTransactionsPage from '../pages/RecurringTransactionsPage'
import SpendingAnalysisPage from '../pages/SpendingAnalysisPage'
import EmergencyFundPage from '../pages/EmergencyFundPage'
import GoalsPage from '../pages/GoalsPage'
import GoalDetailPage from '../pages/GoalDetailPage'
import FinancialFreedomPage from '../pages/FinancialFreedomPage'
import BudgetsPage from '../pages/BudgetsPage'
import NetWorthPage from '../pages/NetWorthPage'
import InvestmentsPage from '../pages/InvestmentsPage'
import SafeToSpendPage from '../pages/SafeToSpendPage'
import NotificationsPage from '../pages/NotificationsPage'
import SettingsPage from '../pages/SettingsPage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'

export const publicRoutes = [
  { path: '/login', element: LoginPage, meta: { title: 'Log in' } },
  { path: '/register', element: RegisterPage, meta: { title: 'Create account' } },
]

export const protectedRoutes = [
  { path: '/dashboard', element: HomePage, meta: { title: 'Overview' } },
  { path: '/profile', element: ProfilePage, meta: { title: 'Profile' } },
  { path: '/accounts', element: AccountsPage, meta: { title: 'Accounts' } },
  { path: '/categories', element: CategoriesPage, meta: { title: 'Categories' } },
  { path: '/transactions', element: TransactionsPage, meta: { title: 'Transactions' } },
  { path: '/subscriptions', element: SubscriptionsPage, meta: { title: 'Subscriptions' } },
  { path: '/recurring-transactions', element: RecurringTransactionsPage, meta: { title: 'Recurring Transactions' } },
  { path: '/spending-analysis', element: SpendingAnalysisPage, meta: { title: 'Spending Analysis' } },
  { path: '/emergency-fund', element: EmergencyFundPage, meta: { title: 'Emergency Fund' } },
  { path: '/goals', element: GoalsPage, meta: { title: 'Goals' } },
  { path: '/goals/:id', element: GoalDetailPage, meta: { title: 'Goal Detail' } },
  { path: '/financial-freedom', element: FinancialFreedomPage, meta: { title: 'Financial Freedom' } },
  { path: '/budgets', element: BudgetsPage, meta: { title: 'Budgets' } },
  { path: '/net-worth', element: NetWorthPage, meta: { title: 'Net Worth' } },
  { path: '/investments', element: InvestmentsPage, meta: { title: 'Investments' } },
  { path: '/safe-to-spend', element: SafeToSpendPage, meta: { title: 'Safe to Spend' } },
  { path: '/notifications', element: NotificationsPage, meta: { title: 'Notifications' } },
  { path: '/settings', element: SettingsPage, meta: { title: 'Settings' } },
]
