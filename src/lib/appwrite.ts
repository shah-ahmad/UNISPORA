import { Account, Client, Databases, Functions, ID, OAuthProvider } from "appwrite";

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1";
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID ?? "6a25cb6500103eec5cb3";

export function getAppwriteEndpoint() {
  if (endpoint.startsWith("/") && typeof window !== "undefined") {
    return `${window.location.origin}${endpoint}`;
  }

  return endpoint;
}

export function getAppwriteProjectId() {
  return projectId;
}

export const appwriteClient = new Client()
  .setEndpoint(getAppwriteEndpoint())
  .setProject(projectId);

export const account = new Account(appwriteClient);
export const databases = new Databases(appwriteClient);
export const functions = new Functions(appwriteClient);
export { ID, OAuthProvider };
