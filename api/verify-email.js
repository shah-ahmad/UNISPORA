import { readVerificationToken } from "./verification-token.js";

const endpoint = process.env.APPWRITE_ENDPOINT ?? process.env.VITE_APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1";
const projectId = process.env.APPWRITE_PROJECT_ID ?? process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ message: "Method not allowed." });
  }

  try {
    if (!projectId) throw new Error("APPWRITE_PROJECT_ID is not configured.");
    if (!apiKey) throw new Error("APPWRITE_API_KEY is not configured.");

    const { token } = request.body ?? {};
    const payload = readVerificationToken(token);
    const user = await getAppwriteUser(payload.userId);

    if (user.email !== payload.email) {
      return response.status(403).json({ message: "This verification link does not match the user." });
    }

    await setEmailVerified(payload.userId, true);
    return response.status(200).json({ message: "Email verified." });
  } catch (error) {
    return response.status(400).json({ message: error instanceof Error ? error.message : "Could not verify email." });
  }
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
