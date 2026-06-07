import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { FormEvent } from "react";
import { LogOut } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";

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

type AuthRole = "student" | "consultant";

export function Auth({
  title,
  action,
  signup = false,
  onSuccess,
}: {
  title: string;
  action: string;
  signup?: boolean;
  onSuccess?: () => void;
}) {
  const navigate = useNavigate();
  const { user, login, signup: createAccount, signInWithGoogle } = useAuth();
  const userLabel = user?.name || user?.email?.split("@")[0] || "UniSpora user";
  const [role, setRole] = useState<AuthRole>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!email.trim() || !password) {
      setMessage("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      if (signup) {
        await createAccount(email.trim(), password, role);
        setEmail("");
        setPassword("");
        setMessage("Check your inbox to verify your email. You can log in after verification.");
        return;
      }

      const user = await login(email.trim(), password);
      const destination = user.prefs?.role === "consultant" ? "/dashboard/consultant" : "/dashboard/student";
      onSuccess?.();
      await navigate({ to: destination });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrap">
      {user ? (
        <AccountCard name={userLabel} email={user.email} />
      ) : (
        <form className="auth-card" onSubmit={submit}>
        <h1>{title}</h1>
        {signup ? (
          <div className="role-choice">
            <button className={role === "student" ? "active" : ""} type="button" onClick={() => setRole("student")}>I am a student</button>
            <button className={role === "consultant" ? "active" : ""} type="button" onClick={() => setRole("consultant")}>I am a consultant</button>
          </div>
        ) : null}
        <input className="lux-input" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" type="email" />
        <input className="lux-input" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={signup ? "new-password" : "current-password"} type="password" minLength={8} />
        {message ? <p className="auth-message">{message}</p> : null}
        <button className="panel-action primary justify-center" type="submit" disabled={submitting}>{submitting ? "Please wait..." : action}</button>
        <div className="auth-divider"><span>or</span></div>
        <button className="google-auth-button" type="button" onClick={signInWithGoogle}>
          <span>G</span>
          Continue with Google
        </button>
        </form>
      )}
    </div>
  );
}

export function AccountCard({ name, email, onSignedOut }: { name: string; email: string; onSignedOut?: () => void }) {
  const { updateUsername, logout } = useAuth();
  const [username, setUsername] = useState(name);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveUsername() {
    const nextName = username.trim();
    if (!nextName) {
      setMessage("Enter a username first.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await updateUsername(nextName);
      setMessage("Username updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update username.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await logout();
    onSignedOut?.();
  }

  return (
    <div className="auth-card account-card">
      <h1>{name}</h1>
      <p className="account-email">{email}</p>
      <label className="account-field">
        <span>Username</span>
        <input className="lux-input" value={username} onChange={(event) => setUsername(event.target.value)} />
      </label>
      {message ? <p className="auth-message">{message}</p> : null}
      <button className="panel-action primary justify-center" type="button" onClick={saveUsername} disabled={saving}>
        {saving ? "Saving..." : "Update username"}
      </button>
      <button className="google-auth-button" type="button" onClick={() => void signOut()}>
        <LogOut size={17} /> Sign Out
      </button>
    </div>
  );
}
