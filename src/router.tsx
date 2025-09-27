import {
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
  async () => import('./pages/CantoLyrLyricGeneration.tsx')
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
const CantoCap = lazy(async () => import('./pages/CantoCap.tsx'));

const rootRoute = createRootRoute({
  component: Root,
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

const cantoCapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/canto-cap',
  component: CantoCap,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  cantoLyrRoute,
  cantoLyrPronunciationRoute,
  cantoLyrRhymeRoute,
  cantoLyrLyricGenerationRoute,
  cantoLyrLyricPronunciationRoute,
  cantoLyrLyricRhymeRoute,
  cantoLyrAiLexiconRoute,
  cantoCapRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
