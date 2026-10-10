import { Query, type Models } from "appwrite";
import { databases } from "./appwrite";

export type CatalogDocument = Models.Document & Record<string, unknown>;
export const catalogDatabase = import.meta.env.VITE_APPWRITE_DATABASE_ID ?? "unispora";
export const universityCollection = import.meta.env.VITE_APPWRITE_UNIVERSITIES_COLLECTION_ID ?? "universities";
export async function listCatalog(collectionId: string) {
  const records: CatalogDocument[] = [];
  for (;;) {
    const page = await databases.listDocuments({ databaseId: catalogDatabase, collectionId,
      queries: [Query.limit(100), Query.orderAsc("$id"), ...(records.length ? [Query.cursorAfter(records.at(-1)!.$id)] : [])] });
    records.push(...page.documents as CatalogDocument[]);
    if (page.documents.length < 100) return records;
  }
}
