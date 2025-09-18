# Canton Lyr Frontend Constitution

## Core Principles

### I. Component-First

Every feature starts as a reusable, self-contained React component. Components
must be independently testable, documented, and have a clear purpose. No
organizational-only components allowed.

### II. TypeScript Strict (NON-NEGOTIABLE)

All code must use strict TypeScript with no `any` types, explicit return types,
and full type coverage. Type safety is enforced at build time.

### III. Test-First (NON-NEGOTIABLE)

TDD mandatory: Tests written → User approved → Tests fail → Then implement.
Red-Green-Refactor cycle strictly enforced. Unit tests for components,
integration tests for features.

### IV. Accessibility Compliance

All components must meet WCAG 2.1 AA standards. Automated and manual
accessibility testing required for every feature.

### V. Responsive Design (NON-NEGOTIABLE)

The UI must be responsive across mobile, tablet, and desktop. Implement
mobile-first layouts using Tailwind CSS responsive variants. Navigation must
provide a mobile-friendly pattern (e.g., shadcn/ui `Sheet` drawer). Sticky
headers require setting `scroll-padding-top` and section `scroll-margin-top` to
prevent anchor overlap. Honor `prefers-reduced-motion`.

### VI. Internationalization Support

All user-facing text must be internationalized using react-i18next. Support for
English and Chinese (Traditional) languages required. Translation keys must be
descriptive and organized by feature domains.

### VII. Theme Support

Application must support light, dark, and system theme modes. Theme preference
should be persisted in localStorage and automatically detect system preference
changes.

## Technology Stack

- React 19+ with hooks
- Vite for build tooling
- TypeScript strict mode
- Tailwind CSS v4
- shadcn/ui for components
- Axios for HTTP requests
- TanStack React Query for data fetching
- Zustand for complex state management
- react-i18next for internationalization
- i18next-browser-languagedetector for language detection
- Vitest for testing
- ESLint and Prettier for code quality
- TanStack Router for page routing (client-side, nested routes, type-safe
  params)

## Recommended Architectural and Methodological Approach

Component-Based Organization: Structure the app using small, reusable
components. Group related components, hooks, and utilities by feature or domain
when possible to maintain clarity and separation of concerns. Functional
Components and Hooks: Use functional components with hooks (useState,
useReducer, useEffect, custom hooks) as the primary building blocks. This keeps
the code clean, less verbose, and easier to test and maintain. Efficient State
Management: Start with React's built-in state and context. For larger or more
complex apps, use Zustand for advanced state management. TDD/Automated Testing:
Write tests alongside components using tools like Jest and React Testing
Library. Prioritize robust unit and integration tests to catch regressions early
and support refactoring. Modular Directory Structure: Organize files into
feature-based or domain-based folders, separating pages, components, hooks,
APIs, and utilities for long-term scalability.

Routing Principles (Required when multiple pages exist)

- Use TanStack Router for all client-side routing.
- Prefer a root layout route that renders global UI like `Header` and `Footer`
  and an `Outlet` for nested pages.
- Use type-safe route params and validated search params; avoid `any` in route
  context.
- Support accessibility: ensure focus management on navigation and
  `aria-current="page"` for active links.
- Keep routes small and enable code-splitting via lazy components where
  appropriate.

### Sample Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base components (shadcn/ui)
│   ├── auth/           # Authentication components
│   └── dashboard/      # Dashboard-specific components
├── hooks/              # Custom hooks
│   ├── useAuth.ts      # Authentication hook
│   └── useApi.ts       # API interaction hook
├── stores/             # Zustand stores
│   ├── authStore.ts    # Authentication state
│   ├── uiStore.ts      # UI state (modals, themes)
│   └── themeStore.ts   # Theme state management
├── lib/                # Utilities and configs
│   ├── utils.ts        # Helper functions
│   ├── api.ts          # API client setup
│   ├── constants.ts    # App constants
│   └── i18n.ts         # Internationalization configuration
├── locales/            # Translation files
│   ├── en.json         # English translations
│   └── zh.json         # Chinese translations
├── types/              # TypeScript definitions
│   ├── user.ts         # User-related types
│   └── api.ts          # API response types
├── pages/              # Route components
│   ├── Login.tsx       # Login page
│   └── Dashboard.tsx   # Dashboard page
├── __tests__/          # Test files
│   ├── components/     # Component tests
│   └── hooks/          # Hook tests
└── assets/             # Static assets
```

Performance Optimizations: Use memoization (React.memo, useMemo), code splitting
(React.lazy, dynamic imports), and virtualization for large data sets. Error
Boundaries and Best Practices: Implement error boundaries for resilience and
follow clear prop passing, single-responsibility principle, and DRY (Don't
Repeat Yourself) practices.

## Development Workflow

- Feature branches from main
- Code reviews verify constitution compliance
- Deployments via automated pipelines

## Governance

Constitution supersedes all other practices. Amendments require documentation,
team approval, and migration plan. All PRs must verify compliance. Complexity
must be justified.

**Version**: 1.2 | **Ratified**: 2025-09-18 | **Last Amended**: 2025-09-18
