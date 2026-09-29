import { account } from "@/lib/appwrite";

export async function sendVerificationEmail() {
  await account.createVerification({ url: new URL("/verify", window.location.origin).href });
}

export async function verifyEmailToken(userId: string, secret: string) {
  await account.updateVerification({ userId, secret });
}
