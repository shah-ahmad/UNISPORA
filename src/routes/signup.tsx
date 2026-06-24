import { createFileRoute } from "@tanstack/react-router";
import { Auth } from "@/components/auth/AuthPanel";
import { AppShell } from "@/components/layout/AppShell";

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
