import { Account, Client, ID } from "appwrite";

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1";
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID ?? "6a2439e0003d1ec5dcd5";

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
export { ID };
