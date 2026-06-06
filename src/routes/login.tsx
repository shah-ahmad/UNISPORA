import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  return (
    <AppShell>
      <Auth title="Welcome back to UniSpora." action="Login" />
    </AppShell>
  );
}

export function Auth({ title, action, signup = false }: { title: string; action: string; signup?: boolean }) {
  return (
    <div className="auth-wrap">
      <form className="auth-card">
        <h1>{title}</h1>
        {signup ? <div className="role-choice"><button type="button">I am a student</button><button type="button">I am a consultant</button></div> : null}
        <input className="lux-input" placeholder="Email address" />
        <input className="lux-input" placeholder="Password" type="password" />
        <button className="panel-action primary justify-center" type="button">{action}</button>
      </form>
    </div>
  );
}
