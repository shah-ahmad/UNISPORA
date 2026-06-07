export async function sendVerificationEmail(userId: string, email: string) {
  const response = await fetch("/api/send-verification", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, email }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message ?? "Could not send verification email.");
  }
}

export async function verifyEmailToken(token: string) {
  const response = await fetch("/api/verify-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message ?? "Could not verify email.");
  }
}
