import type { University } from "@/types/university";

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1";
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID ?? "6a25cb6500103eec5cb3";
const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID ?? "unispora";
const collectionId = import.meta.env.VITE_APPWRITE_UNIVERSITIES_COLLECTION_ID ?? "universities";

type AppwriteUniversityDocument = Partial<University> & {
  $id: string;
};

type AppwriteDocumentsResponse = {
  total: number;
  documents: AppwriteUniversityDocument[];
};

export async function fetchAppwriteUniversities() {
  const query = new URLSearchParams();
  query.append("queries[]", JSON.stringify({ method: "limit", values: [300] }));
  const url = `${endpoint.replace(/\/$/, "")}/databases/${databaseId}/collections/${collectionId}/documents?${query}`;

  const response = await fetch(url, {
    headers: {
      "X-Appwrite-Project": projectId,
    },
  });

  if (!response.ok) {
    throw new Error(`Appwrite returned ${response.status}`);
  }

  const payload = await response.json() as AppwriteDocumentsResponse;
  return payload.documents.map(toUniversity).filter(Boolean) as University[];
}

function toUniversity(document: AppwriteUniversityDocument): University | undefined {
  if (!document.name || !document.city || !document.country) return undefined;
  if (typeof document.latitude !== "number" || typeof document.longitude !== "number") return undefined;

  return {
    id: document.$id,
    name: document.name,
    city: document.city,
    country: document.country,
    continent: document.continent,
    latitude: document.latitude,
    longitude: document.longitude,
    locationUrl: document.locationUrl ?? `https://www.google.com/maps?q=${document.latitude},${document.longitude}`,
    website: document.website ?? "",
    description: document.description ?? "",
    programs: Array.isArray(document.programs) ? document.programs : [],
    tuition: document.tuition ?? "",
    tuitionValue: document.tuitionValue,
    tuitionDetails: document.tuitionDetails,
    applicationFeeNonMedical: document.applicationFeeNonMedical,
    applicationFeeMedical: document.applicationFeeMedical,
    applicationFeeCurrency: document.applicationFeeCurrency,
    applicationFeeLastUpdated: document.applicationFeeLastUpdated,
    applicationFeeSource: document.applicationFeeSource,
    languages: Array.isArray(document.languages) ? document.languages : [],
    languageRequirements: document.languageRequirements,
    englishRequirements: document.englishRequirements,
    localLanguageRequirements: document.localLanguageRequirements,
    scholarships: Array.isArray(document.scholarships) ? document.scholarships : [],
  };
}
