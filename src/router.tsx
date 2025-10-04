import {
  type AnyRoute,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { Root } from './components/Root.tsx';
import { lazy } from 'react';
const CantoLyr = lazy(async () => import('./pages/CantoLyr.tsx'));
const CantoLyrPronunciationSearch = lazy(
  async () => import('./pages/CantoLyrPronunciationSearch.tsx')
);
const CantoLyrRhymeSearch = lazy(
  async () => import('./pages/CantoLyrRhymeSearch.tsx')
);
const CantoLyrLyricGeneration = lazy(
  async () => import('./pages/CantoLyrAiLyricGeneration.tsx')
);
const CantoLyrAiLexiconSearch = lazy(
  async () => import('./pages/CantoLyrAiLexiconSearch.tsx')
);
const CantoLyrLyricPronunciationSearch = lazy(
  async () => import('./pages/CantoLyrLyricPronunciationSearch.tsx')
);
const CantoLyrLyricRhymeSearch = lazy(
  async () => import('./pages/CantoLyrLyricRhymeSearch.tsx')
);
const CantoLyrAiLyricPronunciationSearch = lazy(
  async () => import('./pages/CantoLyrAiLyricPronunciationSearch.tsx')
);
const CantoLyrAiLyricRhymeSearch = lazy(
  async () => import('./pages/CantoLyrAiLyricRhymeSearch.tsx')
);
const CantoCap = lazy(async () => import('./pages/CantoCap.tsx'));
const NotFound = lazy(async () => import('./pages/global/NotFound.tsx'));

// Development-only routes
const TranslationEditor = lazy(
  async () => import('./pages/dev/TranslationEditor.tsx')
);
const TestApiError = lazy(async () => import('./pages/test/TestApiError.tsx'));
const TestNavigationLoaderPreview = lazy(
  async () => import('./pages/test/TestNavigationLoaderPreview.tsx')
);
const translationEditorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/translations',
  component: TranslationEditor,
});
const testApiErrorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/test/api-error',
  component: TestApiError,
});
const testNavigationLoaderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/test/navigation-loader',
  component: TestNavigationLoaderPreview,
});

const rootRoute = createRootRoute({
  component: Root,
  notFoundComponent: NotFound,
});

const Home = lazy(async () => import('./pages/Home.tsx'));
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});

const cantoLyrRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/canto-lyr',
  component: CantoLyr,
});

const cantoLyrPronunciationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/canto-lyr/pronunciation-search',
  component: CantoLyrPronunciationSearch,
});

const cantoLyrRhymeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/canto-lyr/rhyme-search',
  component: CantoLyrRhymeSearch,
});

const cantoLyrLyricGenerationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/canto-lyr/lyric-generation',
  component: CantoLyrLyricGeneration,
});

const cantoLyrLyricPronunciationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/canto-lyr/lyric-search/pronunciation',
  component: CantoLyrLyricPronunciationSearch,
});

const cantoLyrLyricRhymeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/canto-lyr/lyric-search/rhyme',
  component: CantoLyrLyricRhymeSearch,
});

const cantoLyrAiLexiconRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/canto-lyr/ai-lexicon-search',
  component: CantoLyrAiLexiconSearch,
});

const cantoLyrAiLyricPronunciationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/canto-lyr/ai-lyric-pronunciation-search',
  component: CantoLyrAiLyricPronunciationSearch,
});

const cantoLyrAiLyricRhymeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/canto-lyr/ai-lyric-rhyme-search',
  component: CantoLyrAiLyricRhymeSearch,
});

const cantoCapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/canto-cap',
  component: CantoCap,
});

const baseRoutes: AnyRoute[] = [
  homeRoute,
  cantoLyrRoute,
  cantoLyrPronunciationRoute,
  cantoLyrRhymeRoute,
  cantoLyrLyricGenerationRoute,
  cantoLyrLyricPronunciationRoute,
  cantoLyrLyricRhymeRoute,
  cantoLyrAiLexiconRoute,
  cantoLyrAiLyricPronunciationRoute,
  cantoLyrAiLyricRhymeRoute,
  cantoCapRoute,
];

const devRoutes: AnyRoute[] = import.meta.env.PROD
  ? []
  : [translationEditorRoute, testApiErrorRoute, testNavigationLoaderRoute];

const routeTree = rootRoute.addChildren([...baseRoutes, ...devRoutes]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
