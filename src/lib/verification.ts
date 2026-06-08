import { ExecutionMethod } from "appwrite";
import { functions } from "@/lib/appwrite";

const verificationFunctionId = import.meta.env.VITE_APPWRITE_VERIFICATION_FUNCTION_ID ?? "unispora-verification";

export async function sendVerificationEmail(userId: string, email: string) {
  await executeVerification({
    action: "send",
    userId,
    email,
    origin: window.location.origin,
  });
}

export async function verifyEmailToken(token: string) {
  await executeVerification({
    action: "verify",
    token,
  });
}

async function executeVerification(payload: Record<string, unknown>) {
  const execution = await functions.createExecution({
    functionId: verificationFunctionId,
    body: JSON.stringify(payload),
    async: false,
    xpath: "/",
    method: ExecutionMethod.POST,
    headers: {
      "content-type": "application/json",
    },
  });

  const responsePayload = parseResponse(execution.responseBody);
  const responseStatus = execution.responseStatusCode || 500;

  if (responseStatus < 200 || responseStatus >= 300) {
    throw new Error(responsePayload.message ?? "Could not complete verification.");
  }
}

function parseResponse(value: string) {
  try {
    return JSON.parse(value || "{}") as { message?: string };
  } catch {
    return {};
  }
}
