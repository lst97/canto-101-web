# Repository Guidelines

## Coding Style & Naming Conventions

Observe the constitution's TypeScript-strict mandate: no `any`, explicit return
types, and exhaustive discriminated unions. React components use PascalCase,
helpers use camelCase, hooks start with `use`, and Tailwind utility groupings
stay inline unless a variant fits better alongside the component in `src/lib/`.
Use Zustand stores for complex state management, with store files organized in
`src/stores/`. ESLint (see `eslint.config.js`) expects 2-space indentation and
complete hook dependency arrays. Prettier is optional but encouraged for
consistent wrapping.

### Error Handling (Required Patterns)

1. Render / Component Errors: Must be isolated with `react-error-boundary`.
  - Global root wrapped in `AppErrorBoundary`.
  - Data-fetching surfaces additionally wrapped in `QueryErrorBoundary` to leverage React Query reset.
  - No broad `try/catch` inside React render logic or component bodies for render-time errors.
2. Async / HTTP Errors: Centralized in Axios interceptors (`src/lib/api.ts`). Interceptors convert failures to typed `AppError` variants (`network | api | unexpected`). Components and hooks consume normalized errors via React Query or hook state.
3. React Query Errors: Use `useQueryErrorResetBoundary` with `QueryErrorBoundary` for retry flows. Avoid manual `try/catch` around `useQuery`/`mutations`; rely on `error`/`isError` state.
4. Hook State Errors: For imperative flows (e.g. form submissions not yet migrated to React Query), surface string keys referencing i18n (e.g. `cantoLyr.errors.pron.missingQuery`) or user-safe messages.
5. Internationalization: All displayed error text must be translation keys. Raw server messages may be logged but must not appear un-sanitized in UI.
6. Logging (Future): Introduce a pluggable reporter (Sentry, OpenTelemetry) by passing `onError` to `ErrorBoundary`. Keep side effects out of fallback components now.
7. Centralized Logging: All logging must use the Pino-based logger from `src/lib/logger.ts`. Never use `console.log`, `console.error`, etc. directly. Use structured logging with appropriate levels (debug, info, warn, error, fatal).
8. Exhaustiveness: Use discriminated unions for error kinds. Prefer type narrowing helpers (`isAppError`) over `instanceof` where cross-bundle concerns may arise.

### Error Handling Do / Don't

- DO throw inside Axios interceptor so downstream code receives `AppError` without repetitive normalization.
- DO reset queries using the provided boundary reset callback.
- DO NOT swallow errors silently; either handle with UI state or rethrow as `AppError`.
- DO NOT use `any` for error types; prefer `unknown` then narrow.
- DO NOT catch and immediately rethrow the same error unless adding semantic context.

## Validation System

- All frontend data flows validate inputs and outputs with `zod@4.1.11` using
  schemas under `src/lib/schemas/`.
- `src/hooks/useLexiconSearch.ts` is the pattern to follow: user input goes
  through a Zod schema before network calls, and responses are parsed before
  touching UI state.
- Forms surfaced through shadcn/ui components should pair TanStack Form with Zod
  schemas to manage submission, expose real-time validation feedback, and keep
  error handling type-safe end-to-end.
- Any new API interaction must ship with shared schemas, tests covering both
  `safeParse` success/failure, and documentation updates so other agents can
  trace the contract.

## Project Structure & Module Organization

The Vite workspace lives at the repo root, with runtime code in `src/`.
Entrypoint wiring stays in `src/main.tsx`, feature surfaces in `src/App.tsx`,
shared hooks and utilities in `src/lib/`, and static media in `src/assets/`.
Global styles flow through `src/index.css`, Tailwind tokens in
`components.json`, and browser-served assets in `public/`. Environment secrets
belong in `.env.local` with a `VITE_` prefix so Vite exposes them safely.

### Detailed Directory Structure

```
src/
├── App.tsx                    # Main app component
├── assets/                    # Static media files (images, icons)
│   ├── community.png
│   ├── home.png
│   ├── resources.png
│   └── tools.png
├── components/               # Reusable UI components
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

public/                       # Static assets served directly
└── vite.svg                  # Vite logo

.specify/                     # Project specifications and templates
├── memory/                   # Constitution and guidelines
└── templates/                # Code generation templates
```

### Organization Principles

- **Feature-Based Grouping**: Group related components, hooks, and utilities by
  feature or domain (e.g., `auth/`, `dashboard/`) to maintain separation of
  concerns
- **Component Hierarchy**: Keep components small and focused; use composition
  over inheritance
- **State Management**: Use local state for component-specific data; Zustand
  stores for complex, app-wide state
- **Routing**: Use TanStack Router for client-side routing. Define a root layout
  route that renders `Header`/`Footer` and an `Outlet` for nested pages. Keep
  navigation accessible (`aria-current="page"`, focus management on route
  change). Use type-safe params and validated search params.
- **Type Safety**: Centralize type definitions in `src/types/` and import them
  where needed
- **Testing**: Co-locate tests with components (e.g., `Component.test.tsx` next
  to `Component.tsx`) or in `__tests__/`

## Build, Test, and Development Commands

Install dependencies once with `pnpm install`. Use `pnpm dev` for the local
server with hot module reload. Run `pnpm build` to execute the composite
TypeScript + Vite production pipeline. Serve the optimized bundle via
`pnpm preview`. Keep the tree lint-clean with `pnpm lint`, and add
`pnpm exec prettier --write "src/**/*.{ts,tsx,css}"` before shipping larger
refactors. If file-based routing via the TanStack Router plugin is adopted,
ensure route generation scripts run before build.

## Testing Guidelines

Article III requires TDD. Sketch the test in Vitest (target directory
`src/__tests__/` or co-locate as `<name>.test.tsx`), confirm the failing state,
then implement. Favor React Testing Library queries over DOM traversal and
assert accessibility outcomes early. Snapshot only stabilized UI. Add `vitest`
and expose it via `pnpm test -- --run` as soon as coverage exists; maintain ≥80%
coverage for net-new modules.

## Internationalization Guidelines

All user-facing text must use translation keys from `src/locales/`. Use the
`useTranslation` hook from react-i18next in components. Translation keys should
be organized by feature domains (e.g., `common.save`, `lyrics.title`). Always
provide fallback text and ensure translations are complete for all supported
languages (English and Chinese). Language detection is automatic based on
browser settings, with localStorage persistence for user preferences.

Error keys live under the `errors.*` namespace (e.g. `errors.network.title`). Feature-specific validation errors stay scoped (e.g. `cantoLyr.errors.pron.missingQuery`).

## Theme Guidelines

Application supports light, dark, and system theme modes using Tailwind CSS v4.
Use the `useThemeStore` hook for theme state management. Theme preference is
automatically persisted in localStorage and responds to system theme changes.
Use semantic color tokens (e.g., `bg-background`, `text-foreground`) instead of
hardcoded colors to ensure proper theme support.

## Responsive Design Guidelines

- Mobile-first: design for small screens first; scale up progressively with
  Tailwind responsive variants (e.g., `sm:`, `md:`, `lg:`).
- Navigation: Provide a mobile-friendly navigation with a collapsible menu.
  Prefer shadcn/ui `Sheet` for off-canvas drawers. Desktop nav should hide under
  `lg:` with `hidden lg:block`.
- Sticky headers: When using sticky headers, set CSS `scroll-padding-top` and
  `scroll-margin-top` to prevent content being hidden on anchor navigation.
- Active link state: Use `aria-current="page"` for the currently visible
  section; compute with IntersectionObserver for in-page sections.
- Touch targets: Maintain minimum 44x44px tappable areas for interactive
  controls.
- Performance: Avoid layout shifts; respect `prefers-reduced-motion` and disable
  smooth scroll when set.

## Commit & Pull Request Guidelines

History starts with the bootstrap commit; adopt Conventional Commits (`feat:`,
`fix:`, `chore:`) to ease changelog generation. Keep commits focused, linted,
and accompanied by passing tests. PRs must confirm compliance with the
constitution, include a problem summary, implementation notes, manual
verification steps, and screenshots or screen recordings for UI updates. Link
relevant issues and flag follow-ups so agents can coordinate asynchronously.

## Constitutional Obligations

All contributors must stay inside the guardrails defined in
`.specify/memory/constitution.md`: component-first architecture, strict
TypeScript, TDD, WCAG 2.1 AA accessibility, internationalization support, theme
support, and performance budgets (≤500KB bundles, Lighthouse ≥90). Code reviews
enforce these non-negotiables—cite the relevant article when requesting waivers,
and document any amendments before merging.
