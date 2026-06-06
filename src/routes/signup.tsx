import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Auth } from "./login";

export const Route = createFileRoute("/signup")({
  component: Signup,
});

function Signup() {
  return (
    <AppShell>
      <Auth title="Create your UniSpora account." action="Sign Up" signup />
    </AppShell>
  );
}
