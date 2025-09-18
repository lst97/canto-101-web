# Reposi## Coding Style & Naming Conventions
Observe the constitution's TypeScript-strict mandate: no `any`, explicit return types, and exhaustive discriminated unions. React components use PascalCase, helpers use camelCase, hooks start with `use`, and Tailwind utility groupings stay inline unless a variant fits better alongside the component in `src/lib/`. Use Zustand stores for complex state management, with store files organized in `src/stores/`. ESLint (see `eslint.config.js`) expects 2-space indentation and complete hook dependency arrays. Prettier is optional but encouraged for consistent wrapping.ry Guidelines

## Project Structure & Module Organization
The Vite workspace lives at the repo root, with runtime code in `src/`. Entrypoint wiring stays in `src/main.tsx`, feature surfaces in `src/App.tsx`, shared hooks and utilities in `src/lib/`, and static media in `src/assets/`. Global styles flow through `src/index.css`, Tailwind tokens in `components.json`, and browser-served assets in `public/`. Environment secrets belong in `.env.local` with a `VITE_` prefix so Vite exposes them safely.

### Detailed Directory Structure
```
src/
├── components/          # Reusable UI components (shadcn/ui, custom)
│   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   └── [feature]/      # Feature-specific components
├── hooks/              # Custom React hooks
├── stores/             # Zustand state management stores
│   ├── authStore.ts    # Authentication state
│   ├── uiStore.ts      # UI state (modals, themes)
│   └── themeStore.ts   # Theme state management
├── lib/                # Shared utilities and configurations
│   ├── utils.ts        # General utility functions
│   ├── constants.ts    # Application constants
│   └── i18n.ts         # Internationalization configuration
├── locales/            # Translation files
│   ├── en.json         # English translations
│   └── zh.json         # Chinese translations
├── types/              # TypeScript type definitions
├── assets/             # Static media files (images, icons)
├── __tests__/          # Unit and integration tests
└── pages/              # Page-level route components (TanStack Router)

public/                 # Static assets served directly
├── vite.svg
└── [other static files]

.specify/               # Project specifications and templates
├── memory/            # Constitution and guidelines
└── templates/         # Code generation templates
```

### Organization Principles
- **Feature-Based Grouping**: Group related components, hooks, and utilities by feature or domain (e.g., `auth/`, `dashboard/`) to maintain separation of concerns
- **Component Hierarchy**: Keep components small and focused; use composition over inheritance
- **State Management**: Use local state for component-specific data; Zustand stores for complex, app-wide state
- **Routing**: Use TanStack Router for client-side routing. Define a root layout route that renders `Header`/`Footer` and an `Outlet` for nested pages. Keep navigation accessible (`aria-current="page"`, focus management on route change). Use type-safe params and validated search params.
- **Type Safety**: Centralize type definitions in `src/types/` and import them where needed
- **Testing**: Co-locate tests with components (e.g., `Component.test.tsx` next to `Component.tsx`) or in `__tests__/`

## Build, Test, and Development Commands
Install dependencies once with `pnpm install`. Use `pnpm dev` for the local server with hot module reload. Run `pnpm build` to execute the composite TypeScript + Vite production pipeline. Serve the optimized bundle via `pnpm preview`. Keep the tree lint-clean with `pnpm lint`, and add `pnpm exec prettier --write "src/**/*.{ts,tsx,css}"` before shipping larger refactors. If file-based routing via the TanStack Router plugin is adopted, ensure route generation scripts run before build.

## Coding Style & Naming Conventions
Observe the constitution’s TypeScript-strict mandate: no `any`, explicit return types, and exhaustive discriminated unions. React components use PascalCase, helpers use camelCase, hooks start with `use`, and Tailwind utility groupings stay inline unless a variant fits better alongside the component in `src/lib/`. ESLint (see `eslint.config.js`) expects 2-space indentation and complete hook dependency arrays. Prettier is optional but encouraged for consistent wrapping.

## Testing Guidelines
Article III requires TDD. Sketch the test in Vitest (target directory `src/__tests__/` or co-locate as `<name>.test.tsx`), confirm the failing state, then implement. Favor React Testing Library queries over DOM traversal and assert accessibility outcomes early. Snapshot only stabilized UI. Add `vitest` and expose it via `pnpm test -- --run` as soon as coverage exists; maintain ≥80% coverage for net-new modules.

## Internationalization Guidelines
All user-facing text must use translation keys from `src/locales/`. Use the `useTranslation` hook from react-i18next in components. Translation keys should be organized by feature domains (e.g., `common.save`, `lyrics.title`). Always provide fallback text and ensure translations are complete for all supported languages (English and Chinese). Language detection is automatic based on browser settings, with localStorage persistence for user preferences.

## Theme Guidelines
Application supports light, dark, and system theme modes using Tailwind CSS v4. Use the `useThemeStore` hook for theme state management. Theme preference is automatically persisted in localStorage and responds to system theme changes. Use semantic color tokens (e.g., `bg-background`, `text-foreground`) instead of hardcoded colors to ensure proper theme support.

## Responsive Design Guidelines
- Mobile-first: design for small screens first; scale up progressively with Tailwind responsive variants (e.g., `sm:`, `md:`, `lg:`).
- Navigation: Provide a mobile-friendly navigation with a collapsible menu. Prefer shadcn/ui `Sheet` for off-canvas drawers. Desktop nav should hide under `lg:` with `hidden lg:block`.
- Sticky headers: When using sticky headers, set CSS `scroll-padding-top` and `scroll-margin-top` to prevent content being hidden on anchor navigation.
- Active link state: Use `aria-current="page"` for the currently visible section; compute with IntersectionObserver for in-page sections.
- Touch targets: Maintain minimum 44x44px tappable areas for interactive controls.
- Performance: Avoid layout shifts; respect `prefers-reduced-motion` and disable smooth scroll when set.

## Commit & Pull Request Guidelines
History starts with the bootstrap commit; adopt Conventional Commits (`feat:`, `fix:`, `chore:`) to ease changelog generation. Keep commits focused, linted, and accompanied by passing tests. PRs must confirm compliance with the constitution, include a problem summary, implementation notes, manual verification steps, and screenshots or screen recordings for UI updates. Link relevant issues and flag follow-ups so agents can coordinate asynchronously.

## Constitutional Obligations
All contributors must stay inside the guardrails defined in `.specify/memory/constitution.md`: component-first architecture, strict TypeScript, TDD, WCAG 2.1 AA accessibility, internationalization support, theme support, and performance budgets (≤500KB bundles, Lighthouse ≥90). Code reviews enforce these non-negotiables—cite the relevant article when requesting waivers, and document any amendments before merging.
