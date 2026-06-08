import crypto from "node:crypto";

const endpoint = process.env.APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1";
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "UniSpora <verify@unispora.com>";
const tokenSecret = process.env.VERIFICATION_TOKEN_SECRET;

export default async ({ req, res, error }) => {
  try {
    assertServerEnv();

    const payload = parsePayload(req);
    if (payload.action === "send") {
      return await sendVerification(payload, res);
    }

    if (payload.action === "verify") {
      return await verifyEmail(payload, res);
    }

    return res.json({ message: "Unknown verification action." }, 400);
  } catch (caught) {
    error(caught instanceof Error ? caught.message : String(caught));
    return res.json({ message: caught instanceof Error ? caught.message : "Verification failed." }, 400);
  }
};

async function sendVerification(payload, res) {
  const { userId, email } = payload;
  if (!userId || !email) {
    return res.json({ message: "Missing user ID or email." }, 400);
  }

  const user = await getAppwriteUser(userId);
  if (user.email !== email) {
    return res.json({ message: "Email does not match this user." }, 403);
  }

  if (user.emailVerification) {
    return res.json({ message: "Email is already verified." }, 200);
  }

  const token = createVerificationToken({ userId, email });
  const origin = getOrigin(payload.origin);
  const verificationUrl = `${origin}/verify?token=${encodeURIComponent(token)}`;

  await sendResendEmail({
    to: email,
    subject: "Verify your UniSpora account",
    html: renderEmail(verificationUrl),
    text: `Verify your UniSpora account: ${verificationUrl}`,
  });

  return res.json({ message: "Verification email sent." }, 200);
}

async function verifyEmail(payload, res) {
  const tokenPayload = readVerificationToken(payload.token);
  const user = await getAppwriteUser(tokenPayload.userId);

  if (user.email !== tokenPayload.email) {
    return res.json({ message: "This verification link does not match the user." }, 403);
  }

  await setEmailVerified(tokenPayload.userId, true);
  return res.json({ message: "Email verified." }, 200);
}

function assertServerEnv() {
  if (!projectId) throw new Error("APPWRITE_PROJECT_ID is not configured.");
  if (!apiKey) throw new Error("APPWRITE_API_KEY is not configured.");
  if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured.");
  if (!tokenSecret) throw new Error("VERIFICATION_TOKEN_SECRET is not configured.");
}

function parsePayload(req) {
  if (req.bodyJson && typeof req.bodyJson === "object") return req.bodyJson;
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.trim()) return JSON.parse(req.body);
  return {};
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

async function setEmailVerified(userId, emailVerification) {
  const result = await fetch(`${endpoint.replace(/\/$/, "")}/users/${encodeURIComponent(userId)}/verification`, {
    method: "PATCH",
    headers: {
      "X-Appwrite-Project": projectId,
      "X-Appwrite-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ emailVerification }),
  });

  if (!result.ok) {
    const detail = await result.text();
    throw new Error(`Could not update Appwrite verification status: ${detail}`);
  }
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

function createVerificationToken(payload) {
  const body = encode({
    ...payload,
    exp: Date.now() + 1000 * 60 * 60 * 24,
  });
  const signature = sign(body);
  return `${body}.${signature}`;
}

function readVerificationToken(token) {
  const [body, signature] = String(token ?? "").split(".");
  if (!body || !signature || signature !== sign(body)) {
    throw new Error("Invalid verification link.");
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (!payload.exp || payload.exp < Date.now()) {
    throw new Error("This verification link has expired.");
  }

  return payload;
}

function encode(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function sign(value) {
  return crypto
    .createHmac("sha256", tokenSecret)
    .update(value)
    .digest("base64url");
}

function getOrigin(origin) {
  if (typeof origin === "string" && /^https?:\/\//.test(origin)) {
    return origin.replace(/\/$/, "");
  }

  return "https://www.unispora.com";
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
