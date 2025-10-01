# Canto101 Frontend

**Status:** Early Active Development

This repository contains the frontend for Canto101, a comprehensive web platform designed to help users learn the Cantonese language. The project aims to provide learners with a clear roadmap, essential resources, and a suite of powerful tools to aid in their studies.

## Featured Product: CantoLyr

**CantoLyr** is a specialized toolset within Canto101 designed for anyone interested in Cantonese music, poetry, and creative writing. By focusing on the unique phonetic and tonal characteristics of the language, it offers an engaging way to deepen one's understanding and appreciation of Cantonese.

### How CantoLyr Helps You Learn

CantoLyr moves beyond traditional learning methods by immersing users in the artistic and cultural context of Cantonese lyrics.

-   **Master Pronunciation and Tones:** Use the **Pronunciation Search** to find words and see how they are used in actual song lyrics. This helps connect the Jyutping romanization system to real-world sounds and contexts, making it easier to master the nine tones of Cantonese.

-   **Understand Phonetic Nuances:** The **Rhyme Search** tool allows users to discover words that rhyme, providing insight into the phonetic structure of the language. This is invaluable for songwriters and poets, and it helps all learners train their ear to recognize subtle differences in sound.

-   **Learn Vocabulary in Context:** Instead of memorizing isolated words, you can search a vast database of lyrics to see how vocabulary is used naturally and creatively. This provides a richer understanding of word meaning, connotation, and collocation.

-   **Spark Creative Practice:** The **AI-Powered Lyric Generation** tool can help overcome writer's block or provide inspiration for your own creative works. By generating lyrical ideas, it encourages active and creative use of the language, reinforcing what you've learned.

-   **Immerse in Canto-Pop Culture:** Music is a gateway to culture. CantoLyr provides a direct link to the world of Canto-pop, making the learning process more enjoyable and motivating.

## Core Features

-   **Learning Resources & Roadmaps:** Structured guides and materials for learning Cantonese.
-   **Suite of Learning Tools:** Includes specialized applications like `CantoLyr` for lyric analysis and `CantoCap`.
-   **AI-Powered Assistants:** Features across the platform leverage AI to provide advanced learning support, such as lyric generation and lexicon analysis.
-   **Themeable UI:** Supports light and dark modes, with system preference detection.
-   **Internationalization:** Built with support for multiple languages (currently English and Chinese).
-   **Responsive Design:** Mobile-first interface for a seamless experience on all devices.

## Tech Stack

-   **Framework:** [React](https://react.dev/)
-   **Build Tool:** [Vite](https://vitejs.dev/)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/) v4
-   **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
-   **Routing:** [TanStack Router](https://tanstack.com/router)
-   **Data Fetching:** [TanStack Query](https://tanstack.com/query) (React Query)
-   **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
-   **Form Management:** [TanStack Form](https://tanstack.com/form)
-   **Validation:** [Zod](https://zod.dev/)
-   **Internationalization:** [i18next](https://www.i18next.com/) / [react-i18next](https://react.i18next.com/)
-   **Testing:** [Vitest](https://vitest.dev/) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (LTS version)
-   [pnpm](https://pnpm.io/)

### Installation & Development

1.  **Install dependencies:**
    ```bash
    pnpm install
    ```

2.  **Run the development server:**
    ```bash
    pnpm dev
    ```
    The application will be available at `http://localhost:5173` (or the next available port).

## Available Scripts

-   `pnpm dev`: Starts the development server with Hot Module Replacement.
-   `pnpm build`: Compiles and bundles the application for production.
-   `pnpm preview`: Serves the production build locally for previewing.
-   `pnpm lint`: Lints the codebase using ESLint.
-   `pnpm test`: Runs tests using Vitest.
-   `pnpm test:run`: Runs tests once without watch mode.
-   `pnpm format`: Formats code with Prettier.

## Project Structure

The codebase is organized with a focus on feature-based grouping and separation of concerns.

```
src/
├── components/   # Reusable UI components (feature-specific and shared)
├── hooks/        # Custom React hooks
├── lib/          # Core logic, configs, and utilities (API, i18n, Zod schemas)
├── pages/        # Top-level route components
├── stores/       # Zustand state management stores
├── styles/       # Global styles
├── types/        # TypeScript type definitions
├── router.tsx    # TanStack Router configuration
└── main.tsx      # Application entry point
```

## Development Guidelines

This project adheres to a strict set of guidelines to maintain code quality, consistency, and scalability.

-   **TypeScript Strict:** The use of `any` is disallowed. All functions must have explicit return types.
-   **Error Handling:** A centralized error handling mechanism is enforced using `react-error-boundary` for UI and Axios interceptors for API errors. All errors are typed and handled gracefully.
-   **Validation:** [Zod](https://zod.dev/) is used for all data validation, from API responses to form inputs, ensuring type safety across the application.
-   **Testing:** Test-Driven Development (TDD) is required. New features must be accompanied by tests written with [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/).
-   **Internationalization (i18n):** All user-facing strings must be added to the translation files in `src/locales/`.
-   **Theming:** Components must be styled using semantic color tokens (e.g., `bg-background`) to support both light and dark themes.
-   **Responsive Design:** A mobile-first approach is mandatory. Use Tailwind's responsive variants (`sm:`, `md:`, etc.) to scale up for larger screens.

For more detailed information, refer to the [Repository Guidelines](AGENTS.md).

## Contributing

Contributions are welcome. Please follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for commit messages and adhere to the PR guidelines outlined in [AGENTS.md](AGENTS.md).

## License

This project is licensed under the terms of the LICENSE file.