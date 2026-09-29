import { Outlet, createRootRoute } from "@tanstack/react-router";

import { AdvisorChat } from "@/components/ai/AdvisorChat";

export const Route = createRootRoute({
  component: () => <><Outlet /><AdvisorChat /></>,
});
