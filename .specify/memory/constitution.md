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

### VIII. Error Handling Architecture (NON-NEGOTIABLE)

1. Rendering / Component Errors:
  - Must be captured by `react-error-boundary` instances.
  - Root layout wraps the app with `AppErrorBoundary`.
  - Data-fetching UI regions (pages, complex widgets) use `QueryErrorBoundary` coupled with `useQueryErrorResetBoundary`.
2. Async / Network Errors:
  - All Axios requests flow through a single client (`src/lib/api.ts`).
  - Response interceptor transforms errors into typed `AppError` variants:
    - `network` (no response / connectivity)
    - `api` (HTTP status >= 400)
    - `unexpected` (anything else)
3. Error Types:
  - Defined in `src/types/errors.ts` as a discriminated union.
  - No `any` in error surfaces; start from `unknown`, then refine.
4. React Query:
  - Use built-in error states (`error`, `isError`) instead of wrapping query functions with manual `try/catch`.
  - Reset flows initiated via boundary `onReset` or the query reset boundary.
5. User-Facing Messages:
  - Always internationalized. Raw server strings are never rendered directly unless mapped to a key. Fallback copy lives in `errors.*` namespace.
6. Logging:
  - All logging must use Pino via the centralized logger in `src/lib/logger.ts`.
  - Prohibit direct use of `console.log`, `console.error`, etc.
  - Use structured logging with levels: debug, info, warn, error, fatal.
  - Future: Integrate with external reporters (Sentry, OpenTelemetry) via logger configuration.
7. Prohibited Patterns:
  - Broad `try/catch` in component render bodies.
  - Silent error suppression (empty catch blocks or ignored promise rejections).
8. Future Extension:
  - Central logging/reporting hook can be injected via boundary `onError` without altering component trees.

All new components must declare how they surface operational errors (boundary, query error UI, or controlled form state) in their PR description per governance rules.

### IX. Schema Validation Contract (NON-NEGOTIABLE)

- Frontend search flows and data hooks (`frontend/src/hooks/`) must validate user
  inputs and server payloads with `zod@4.1.11`, using shared schemas under
  `frontend/src/lib/schemas/`.
- `frontend/src/hooks/useLexiconSearch.ts` is the reference implementation:
  inputs are parsed before requests and responses are parsed before state is mutated.
- Form surfaces rendered with shadcn/ui components must integrate TanStack Form
  so validation stays centralized, error handling remains type-safe, and
  real-time feedback is delivered to users.
- New UI features that fetch data must provide matching Zod schemas and verify
  both `safeParse` success and failure paths via tests.

## Technology Stack

- React 19+ with hooks
- Vite for build tooling
- TypeScript strict mode
- Zod v4 for shared schema validation
- Tailwind CSS v4
- shadcn/ui for components
- TanStack Form for headless, type-safe form state management
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

### Project Structure

```
src/
├── App.tsx                    # Main app component
├── assets/                    # Static media files (images, icons)
│   ├── community.png
│   ├── home.png
│   ├── resources.png
│   └── tools.png
├── components/                # Reusable UI components
│   ├── Root.tsx              # Root layout component
│   ├── Footer.tsx            # Footer component
│   ├── Header.tsx            # Header component
│   ├── ThemeProvider.tsx     # Theme context provider
│   ├── ThemeToggle.tsx       # Theme toggle button
│   ├── mode-toggle.tsx       # Mode toggle component
│   ├── LanguageSwitcher.tsx  # Language switcher component
│   ├── cantoLyr/             # CantoLyr feature components
│   ├── errors/               # Error boundary components
│   ├── home/                 # Home page components
│   └── ui/                   # Base UI components (shadcn/ui)
├── hooks/                    # Custom React hooks
│   ├── useLexiconSearch.ts   # Hook for lexicon search
│   └── useLyricGeneration.ts # Hook for lyric generation
├── lib/                      # Shared utilities and configurations
│   ├── api.ts                # Axios API client and interceptors
│   ├── constants.ts          # Application constants
│   ├── i18n.ts               # Internationalization configuration
│   ├── logger.ts             # Pino-based centralized logger
│   ├── queryClient.ts        # TanStack Query client setup
│   ├── schemas/              # Shared Zod schemas
│   │   └── lexicon.ts        # Lexicon request/response validators
│   └── utils.ts              # General utility functions
├── locales/                  # Translation files
│   ├── en.json               # English translations
│   └── zh.json               # Chinese translations
├── pages/                    # Page-level route components
│   ├── CantoCap.tsx          # CantoCap page
│   ├── CantoLyr.tsx          # CantoLyr page
│   └── Home.tsx              # Home page
├── router.tsx                # TanStack Router configuration
├── stores/                   # Zustand state management stores
│   └── themeStore.ts         # Theme state store
├── styles/                   # Styles files
|.  └── index.css             # Global style
├── types/                    # TypeScript type definitions
│   └── errors.ts             # Error type definitions
├── index.css                 # Global CSS styles
├── main.tsx                  # Application entry point
└── vite-env.d.ts             # Vite environment types
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
