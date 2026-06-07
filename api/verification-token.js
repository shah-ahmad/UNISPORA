import crypto from "node:crypto";

const tokenSecret = process.env.VERIFICATION_TOKEN_SECRET;

export function createVerificationToken(payload) {
  if (!tokenSecret) {
    throw new Error("VERIFICATION_TOKEN_SECRET is not configured.");
  }

  const body = encode({
    ...payload,
    exp: Date.now() + 1000 * 60 * 60 * 24,
  });
  const signature = sign(body);
  return `${body}.${signature}`;
}

export function readVerificationToken(token) {
  if (!tokenSecret) {
    throw new Error("VERIFICATION_TOKEN_SECRET is not configured.");
  }

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
