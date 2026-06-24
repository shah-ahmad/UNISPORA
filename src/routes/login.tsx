import { createFileRoute } from "@tanstack/react-router";
import { Auth } from "@/components/auth/AuthPanel";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const oauthStatus = new URLSearchParams(window.location.search).get("oauth") ?? undefined;

  return (
    <AppShell>
      <Auth title="Welcome back to UniSpora." action="Login" oauthStatus={oauthStatus} />
    </AppShell>
  );
}
