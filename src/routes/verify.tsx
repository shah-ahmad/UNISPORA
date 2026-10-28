import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/verify")({
  component: VerifyEmail,
});

function VerifyEmail() {
  const { verifyEmail } = useAuth();
  const verificationStarted = useRef(false);
  const [status, setStatus] = useState<"checking" | "success" | "error">("checking");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (verificationStarted.current) return;
    verificationStarted.current = true;

    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId");
    const secret = params.get("secret");
    // Remove verification credentials even if the request later fails.
    window.history.replaceState(null, "", window.location.pathname);

    if (!userId || !secret) {
      setStatus("error");
      setMessage(params.has("token") ? "This is an older verification link. Log in to request a new email." : "This verification link is missing the required details.");
      return;
    }

    verifyEmail(userId, secret)
      .then(() => {
        window.history.replaceState(null, "", window.location.pathname);
        setStatus("success");
        setMessage("Your email has been verified. Please log in to continue.");
      })
      .catch((error) => {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "We could not verify this email link.");
      });
  }, [verifyEmail]);

  return (
    <AppShell>
      <section className="auth-wrap">
        <div className="auth-card verify-card">
          <h1>{status === "success" ? "Email verified." : status === "error" ? "Verification failed." : "Checking email."}</h1>
          <p className="auth-message">{message}</p>
          <Link className="panel-action primary justify-center" to="/login">
            {status === "success" ? "Continue to login" : "Log in to request a new link"}
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
