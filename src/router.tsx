import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { z } from "zod";

import { Simulator } from "@/components/simulator/simulator";

const rootRoute = createRootRoute({ component: Outlet });

/** `s` holds the compressed scenario, so a link reproduces exactly what you see. */
const simulatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: z.object({ s: z.string().optional() }),
  component: Simulator,
});

export const router = createRouter({
  routeTree: rootRoute.addChildren([simulatorRoute]),
  basepath: import.meta.env.BASE_URL.replace(/\/$/, "") || "/",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
