import { Account, Client, Databases, ID, OAuthProvider } from "appwrite";

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1";
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID ?? "6a25cb6500103eec5cb3";

function getEndpoint() {
  if (endpoint.startsWith("/") && typeof window !== "undefined") {
    return `${window.location.origin}${endpoint}`;
  }

  return endpoint;
}

export const appwriteClient = new Client()
  .setEndpoint(getEndpoint())
  .setProject(projectId);

export const account = new Account(appwriteClient);
export const databases = new Databases(appwriteClient);
export { ID, OAuthProvider };
