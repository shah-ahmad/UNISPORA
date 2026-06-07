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

    if (!userId || !secret) {
      setStatus("error");
      setMessage("This verification link is missing the required details.");
      return;
    }

    verifyEmail(userId, secret)
      .then(() => {
        setStatus("success");
        setMessage("Your email has been verified. You can continue using UniSpora.");
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
          <Link className="panel-action primary justify-center" to="/">
            Back to UniSpora
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
