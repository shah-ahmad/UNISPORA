import { createVerificationToken } from "./verification-token.js";

const endpoint = process.env.APPWRITE_ENDPOINT ?? process.env.VITE_APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1";
const projectId = process.env.APPWRITE_PROJECT_ID ?? process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "UniSpora <verify@unispora.com>";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ message: "Method not allowed." });
  }

  try {
    assertServerEnv();
    const { userId, email } = request.body ?? {};
    if (!userId || !email) {
      return response.status(400).json({ message: "Missing user ID or email." });
    }

    const user = await getAppwriteUser(userId);
    if (user.email !== email) {
      return response.status(403).json({ message: "Email does not match this user." });
    }

    if (user.emailVerification) {
      return response.status(200).json({ message: "Email is already verified." });
    }

    const token = createVerificationToken({ userId, email });
    const origin = getOrigin(request);
    const verificationUrl = `${origin}/verify?token=${encodeURIComponent(token)}`;

    await sendResendEmail({
      to: email,
      subject: "Verify your UniSpora account",
      html: renderEmail(verificationUrl),
      text: `Verify your UniSpora account: ${verificationUrl}`,
    });

    return response.status(200).json({ message: "Verification email sent." });
  } catch (error) {
    return response.status(500).json({ message: error instanceof Error ? error.message : "Could not send verification email." });
  }
}

function assertServerEnv() {
  if (!projectId) throw new Error("APPWRITE_PROJECT_ID is not configured.");
  if (!apiKey) throw new Error("APPWRITE_API_KEY is not configured.");
  if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured.");
}

async function getAppwriteUser(userId) {
  const result = await fetch(`${endpoint.replace(/\/$/, "")}/users/${encodeURIComponent(userId)}`, {
    headers: {
      "X-Appwrite-Project": projectId,
      "X-Appwrite-Key": apiKey,
    },
  });

  if (!result.ok) {
    throw new Error("Could not read Appwrite user.");
  }

  return result.json();
}

async function sendResendEmail({ to, subject, html, text }) {
  const result = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject,
      html,
      text,
    }),
  });

  if (!result.ok) {
    const detail = await result.text();
    throw new Error(`Resend rejected the email: ${detail}`);
  }
}

function getOrigin(request) {
  const host = request.headers["x-forwarded-host"] ?? request.headers.host;
  const protocol = request.headers["x-forwarded-proto"] ?? "https";
  return `${protocol}://${host}`;
}

function renderEmail(url) {
  return `
    <div style="font-family: Arial, sans-serif; color: #17212b; line-height: 1.6;">
      <h1 style="margin: 0 0 12px;">Verify your UniSpora account</h1>
      <p>Confirm your email address to finish creating your UniSpora account.</p>
      <p>
        <a href="${url}" style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #e5a93b; color: #111; font-weight: 700; text-decoration: none;">
          Verify email
        </a>
      </p>
      <p style="font-size: 13px; color: #5f6b76;">This link expires in 24 hours.</p>
    </div>
  `;
}
