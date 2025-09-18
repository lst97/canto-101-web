import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Root } from "@/components/Root";
import { lazy } from "react";
const CantoLyr = lazy(async () => import("@/pages/CantoLyr"));
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

const cantoCapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/canto-cap",
  component: CantoCap,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  cantoLyrRoute,
  cantoCapRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
