import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Root } from "@/components/Root";
import { lazy } from "react";
const CantoLyr = lazy(async () => import("@/pages/CantoLyr"));
const CantoLyrPronunciationSearch = lazy(async () => import("@/pages/CantoLyrPronunciationSearch"));
const CantoLyrRhymeSearch = lazy(async () => import("@/pages/CantoLyrRhymeSearch"));
const CantoLyrLyricGeneration = lazy(async () => import("@/pages/CantoLyrLyricGeneration"));
const CantoLyrAiLexiconSearch = lazy(async () => import("@/pages/CantoLyrAiLexiconSearch"));
const CantoCap = lazy(async () => import("@/pages/CantoCap"));

const rootRoute = createRootRoute({
  component: Root,
});

const Home = lazy(async () => import("@/pages/Home"));
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

const cantoLyrRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/canto-lyr",
  component: CantoLyr,
});

const cantoLyrPronunciationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/canto-lyr/pronunciation-search",
  component: CantoLyrPronunciationSearch,
});

const cantoLyrRhymeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/canto-lyr/rhyme-search",
  component: CantoLyrRhymeSearch,
});

const cantoLyrLyricGenerationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/canto-lyr/lyric-generation",
  component: CantoLyrLyricGeneration,
});

const cantoLyrAiLexiconRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/canto-lyr/ai-lexicon-search",
  component: CantoLyrAiLexiconSearch,
});

const cantoCapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/canto-cap",
  component: CantoCap,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  cantoLyrRoute,
  cantoLyrPronunciationRoute,
  cantoLyrRhymeRoute,
  cantoLyrLyricGenerationRoute,
  cantoLyrAiLexiconRoute,
  cantoCapRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
