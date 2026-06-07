import { databases } from "@/lib/appwrite";

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID ?? "unispora";
const usernameCollectionId = import.meta.env.VITE_APPWRITE_USERNAMES_COLLECTION_ID ?? "usernames";

type UsernameReservation = {
  username: string;
  email?: string;
  userId?: string;
};

export function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[^a-z0-9]+/, "")
    .replace(/[^a-z0-9]+$/, "")
    .slice(0, 36);
}

export function validateUsername(value: string) {
  const normalized = normalizeUsername(value);

  if (normalized.length < 3) {
    throw new Error("Username must be at least 3 characters.");
  }

  if (!/^[a-z0-9][a-z0-9._-]*$/.test(normalized)) {
    throw new Error("Username can use letters, numbers, dots, dashes, and underscores.");
  }

  return normalized;
}

export async function reserveUsername(username: string, data: Omit<UsernameReservation, "username"> = {}) {
  const normalized = validateUsername(username);

  try {
    await databases.createDocument({
      databaseId,
      collectionId: usernameCollectionId,
      documentId: normalized,
      data: {
        username: normalized,
        ...data,
      },
    });
  } catch (error) {
    if (isConflict(error)) {
      throw new Error("That username is already taken.");
    }

    if (isMissingRegistry(error)) {
      throw new Error("Username registry is not configured yet.");
    }

    throw error;
  }

  return normalized;
}

export async function reserveAutomaticUsername(email: string, data: Omit<UsernameReservation, "username"> = {}) {
  const emailPrefix = email.split("@")[0] ?? "user";
  const baseUsername = normalizeUsername(emailPrefix) || "user";
  const compactBase = baseUsername.slice(0, 30);

  for (let index = 0; index < 50; index += 1) {
    const candidate = index === 0 ? compactBase : `${compactBase}-${index + 1}`;

    try {
      return await reserveUsername(candidate, {
        email,
        ...data,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "That username is already taken.") {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Could not create a unique username. Try again.");
}

export async function releaseUsername(username: string) {
  const normalized = normalizeUsername(username);
  if (!normalized) return;

  await databases.deleteDocument({
    databaseId,
    collectionId: usernameCollectionId,
    documentId: normalized,
  });
}

function isConflict(error: unknown) {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    Number((error as { code?: unknown }).code) === 409;
}

function isMissingRegistry(error: unknown) {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    Number((error as { code?: unknown }).code) === 404;
}
