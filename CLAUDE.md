# CLAUDE.md — Financial Freedom OS Frontend

## 1. Project Purpose

This is a personal financial freedom web application.

The application helps the user understand:
- income
- spending
- savings
- emergency fund
- financial goals
- net worth
- overspending
- safe-to-spend amount
- financial freedom projections

The frontend is a React + Vite application.

Appwrite is the only external backend/data platform.

There is NO custom backend API in this project.

---

## 2. Mandatory Stack

Use the project's approved versions of:

- React
- Vite
- React Router
- TanStack Query
- React Hook Form
- Zod
- Jotai
- react-hot-toast
- date-fns
- Appwrite Web SDK

Use ES6+ syntax and ES Modules.

Preferred:
- const / let
- arrow functions
- destructuring
- spread/rest
- import/export

Avoid:
- var
- CommonJS
- unnecessary class components
- duplicated logic
- unnecessary abstractions

---

## 3. Source of Truth

Before implementing ANY task:

1. Read this CLAUDE.md completely.
2. Inspect the existing repository structure.
3. If `repomix-output.xml` exists, read it before coding.
4. Inspect relevant existing files before creating new files.
5. Reuse existing components, hooks, utilities and services where appropriate.
6. Do not recreate functionality that already exists.
7. Follow the architecture in this file even if a shortcut appears faster.

This file is a mandatory development rule, not a suggestion.

---

# 4. Appwrite-Only Backend Architecture

This project does not contain a custom backend.

Do NOT create:
- Express backend
- Laravel backend
- REST API endpoints
- API controllers
- backend routes
- backend repositories
- Axios API layer
- Swagger/OpenAPI documentation
- API documentation files

Appwrite is the external backend/data platform.

Architecture:

Page
  ↓
Functionality Hook
  ↓
Appwrite/TanStack Query Hook
  ↓
Appwrite Service
  ↓
Appwrite SDK
  ↓
External Appwrite

Pages and UI components must never call Appwrite SDK methods directly.

All Appwrite communication must go through:

src/services/appwrite/

---

# 5. Frontend Architecture

Mandatory flow:

Page
  ↓
Functionality Hook
  ↓
API/Data Hook
  ↓
Service
  ↓
Appwrite SDK

UI flow:

Page
  ↓
Feature Components
  ↓
Reusable UI Components

Responsibilities:

Page
- composition only
- no Appwrite calls
- no service calls
- no business logic
- no complex state

Functionality Hook
- page orchestration
- UI state
- form state
- event handlers
- derived values
- navigation
- API/data hook coordination
- toast coordination

API/Data Hook
- TanStack Query
- query keys
- queries
- mutations
- invalidation
- loading/error/server state

Service
- Appwrite SDK interaction
- database operations
- authentication operations
- basic request/response normalization

Component
- rendering
- local UI-only state where genuinely appropriate

---

# 6. Project Structure

Use this structure:

src/
├── assets/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── forms/
│   └── [feature]/
├── config/
├── constants/
├── hooks/
│   ├── functionality/
│   ├── api/
│   └── common/
├── inputs/
│   └── [feature]/
├── pages/
├── routes/
├── services/
│   └── appwrite/
├── store/
├── validations/
│   └── [feature]/
├── utils/
├── App.jsx
└── main.jsx

Do not create a competing architecture.

---

# 7. File Size

Production source files should normally remain between 100–250 lines.

250 lines is the preferred maximum.

If a file becomes too large, split it by responsibility.

Do not compress/minify code to bypass this rule.

---

# 8. Pages

Pages must remain thin.

Pages must NOT contain:
- Appwrite calls
- service calls
- fetch calls
- Axios calls
- business logic
- complex data transformations
- mutation/query implementation
- permission calculations
- complicated event handlers

A page should normally:
1. call a functionality hook;
2. receive state/data/actions;
3. compose components;
4. pass props.

---

# 9. Functionality Hooks

Use:

hooks/functionality/useActionXxx.js

Examples:
- useActionLogin.js
- useActionDashboard.js
- useActionTransaction.js
- useActionAccount.js
- useActionGoal.js

Functionality hooks may own:
- form state
- UI state
- event handlers
- derived values
- validation coordination
- Appwrite/TanStack Query hook calls
- navigation
- confirmation flows
- toast coordination
- page-specific orchestration

They must NOT call Appwrite SDK directly.

---

# 10. Forms and Validation

Use React Hook Form for complex forms.

Use Zod for validation.

Store validation schemas under:

src/validations/[feature]/

Store reusable field/input definitions under:

src/inputs/[feature]/

Do not define large input configurations directly inside pages.

Do not put validation schemas directly inside pages or large functionality hooks.

Frontend validation improves UX but does not replace Appwrite/security validation.

---

# 11. Appwrite Services

Store Appwrite services under:

src/services/appwrite/

Examples:
- appwriteClient.js
- auth.service.js
- profile.service.js
- account.service.js
- transaction.service.js
- category.service.js
- budget.service.js
- goal.service.js
- emergencyFund.service.js

Use the Appwrite SDK only inside this service layer.

Do not duplicate Appwrite client configuration.

---

# 12. Appwrite Security

Every user-owned document must be protected by Appwrite permissions.

Do not rely only on frontend filtering such as:

transaction.userId === currentUser.id

Appwrite permissions are the security boundary.

Never expose:
- API secrets
- private keys
- provider secrets
- server credentials

in frontend source.

Public Appwrite project configuration may be exposed where required by the Web SDK, but sensitive credentials must never be shipped to the browser.

---

# 13. Authentication

Support:
- register
- login
- logout
- current user/session restoration
- protected routes

Use:
routes/
├── AppRouter.jsx
├── routes.js
├── ProtectedRoute.jsx
└── NotFoundPage.jsx

Authentication implementation belongs in the Appwrite authentication service and associated hooks.

---

# 14. TanStack Query

Server state must use TanStack Query.

Do not duplicate Appwrite server data into global client state without a genuine reason.

Use stable query keys.

Example:
['transactions', params]
['transaction', id]
['accounts']
['goals']
['dashboard', params]

Mutations should invalidate affected queries.

---

# 15. Client State

Use Jotai only for genuine client/UI state such as:
- sidebar state
- theme state
- temporary selections
- modal state
- local preferences

Do not use Jotai as a replacement for TanStack Query.

---

# 16. Tactile Neo-Dark Design

The entire application must follow the Tactile Neo-Dark design direction.

Visual characteristics:
- deep dark background
- tactile raised surfaces
- subtle borders
- controlled shadows
- high-quality typography
- strong visual hierarchy
- muted secondary text
- clear financial metrics
- restrained accent color
- rounded surfaces without excessive softness
- polished hover/focus/active states
- responsive layouts

Avoid:
- generic dashboard templates
- excessive gradients
- excessive glassmorphism
- random colors
- excessive animations
- overly playful UI
- inconsistent card styles
- inconsistent spacing

Create a reusable design system instead of styling every feature independently.

---

# 17. Reusable UI

Reusable components should be created under:

src/components/ui/

At minimum where needed:
- Button
- Input
- Select
- Card
- Badge
- Modal
- ConfirmModal
- Progress
- Tabs
- Dropdown
- Skeleton
- EmptyState
- ErrorState
- StatCard

Do not create ad-hoc duplicates inside feature pages.

---

# 18. Modal Architecture

All application modals must use React Portal.

Use createPortal from react-dom.

Provide a modal root in the application HTML:

<div id="root"></div>
<div id="modal-root"></div>

Support:
- keyboard accessibility
- Escape-to-close where appropriate
- focus management
- backdrop behavior
- body scroll handling where required
- accessible labels

Business actions belong to functionality hooks/feature logic, not the shared modal component.

---

# 19. Routing

routes/routes.js is the route configuration source of truth.

It may contain:
- path
- element
- protected status
- metadata

Do not put API calls or business logic into routes.js.

AppRouter creates the React Router tree.

ProtectedRoute handles authentication protection.

---

# 20. Financial MVP Scope

The first version should focus on:

1. Authentication
2. Financial profile
3. Accounts
4. Categories
5. Transactions
6. Dashboard
7. Spending analysis
8. Overspending detection
9. Emergency fund
10. Financial goals
11. Net worth
12. Financial freedom projection
13. Financial Action Center

Do not expand scope during implementation unless explicitly requested.

---

# 21. Appwrite Data Model

Recommended collections:

profiles
accounts
transactions
categories
budgets
emergency_funds
goals
debts
settings

User-owned documents should include a userId where appropriate and use Appwrite document permissions.

Recommended transaction fields:

userId
accountId
type
amount
categoryId
description
date
isEssential
isRecurring
createdAt
updatedAt

Recommended account fields:

userId
name
type
balance
currency
isActive
createdAt
updatedAt

Recommended profile fields:

userId
name
currency
monthlyIncome
monthlySavingsTarget
createdAt
updatedAt

Do not create database collections blindly. Inspect the existing Appwrite setup/configuration first if available.

---

# 22. Financial Logic

Financial calculations should be placed in reusable utilities under:

src/utils/finance/

Examples:
- savings rate
- monthly totals
- safe-to-spend
- emergency fund coverage
- net worth
- goal progress
- financial freedom projection

Do not duplicate calculations inside components.

Calculations should be deterministic and testable.

Clearly distinguish:
- actual values
- estimates
- projections

Do not present projections as guaranteed financial outcomes.

---

# 23. Dashboard Principles

The dashboard should answer:

1. How much did I earn?
2. How much did I spend?
3. How much did I save?
4. How much can I safely spend?
5. Am I overspending?
6. How strong is my emergency fund?
7. What is my net worth?
8. What should I do next?

The dashboard should prioritize actions over decorative charts.

---

# 24. Financial Action Center

The application should provide actionable recommendations such as:

- reduce a category that is significantly above its normal range
- increase emergency fund contribution
- reduce discretionary spending
- identify unused subscriptions
- keep savings rate on target
- highlight goal progress

Start with deterministic rules.

Do not introduce AI merely to generate simple calculations.

---

# 25. What-If / Financial Freedom

Financial freedom calculations are estimates.

Inputs may include:
- current age
- current net worth
- monthly income
- monthly expenses
- monthly investment
- expected annual return
- annual expense growth
- annual income growth

Allow scenario comparison where practical.

Clearly label assumptions.

---

# 26. Loading, Empty and Error States

Every Appwrite-driven page must handle:
- loading
- empty
- error
- success

Never leave blank screens while data is loading.

Never expose raw technical errors directly to users.

---

# 27. Accessibility

Use:
- semantic HTML
- labels
- keyboard-accessible controls
- visible focus states
- appropriate ARIA attributes
- accessible modals
- meaningful validation messages

Do not use clickable divs when a button is appropriate.

---

# 28. Responsive Design

The application must work on:
- desktop
- tablet
- mobile

The Tactile Neo-Dark visual system must remain consistent across breakpoints.

---

# 29. Security

Never:
- hardcode secrets
- expose sensitive credentials
- log passwords
- log access tokens
- put secrets in URLs
- rely on frontend-only security

Use Appwrite permissions for data access control.

---

# 30. No Unnecessary Backend/API Work

This project intentionally has no custom API backend.

Do not create backend workarounds because an Appwrite operation is inconvenient.

If an operation genuinely requires server-side privileged logic, stop and report the requirement instead of placing secrets or privileged operations in React.

Appwrite Functions may be considered later for legitimate server-side operations.

---

# 31. Development Rules for Claude

For EVERY task:

1. Read CLAUDE.md first.
2. Inspect the repository before coding.
3. Inspect existing relevant files.
4. Reuse existing code.
5. Do not change unrelated functionality.
6. Do not invent architecture.
7. Do not invent APIs.
8. Do not invent Appwrite collections when existing configuration already defines them.
9. Follow the Appwrite-only architecture.
10. Keep pages thin.
11. Keep files within the 100–250 line target.
12. Use functionality hooks for page orchestration.
13. Use TanStack Query for server state.
14. Use Appwrite services for Appwrite SDK calls.
15. Use React Hook Form + Zod for appropriate forms.
16. Use the Tactile Neo-Dark design system.
17. Verify imports and routes after changes.
18. Run the production build after completing the task.
19. Report what was changed.
20. Report any assumptions or blockers.

---

# 32. Task Execution Rule

Implement ONLY the task provided in the current prompt.

Do not start future tasks automatically.

Do not build unrelated features "for completeness".

If a dependency on a future task is required:
- create only the minimum foundation required;
- clearly report the dependency;
- do not implement the future feature.

---

# 33. Completion Criteria

A task is complete only when:

- implementation is working
- architecture rules are followed
- no obvious duplicate code was introduced
- affected imports are valid
- affected routes work
- loading/empty/error states are handled where applicable
- `npm run build` succeeds
- no secrets are exposed
- no unrelated functionality was changed

