import type { Scholarship } from "@/data/scholarships";

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1";
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID ?? "6a25cb6500103eec5cb3";
const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID ?? "unispora";
const collectionId = import.meta.env.VITE_APPWRITE_SCHOLARSHIPS_COLLECTION_ID ?? "scholarships";

type AppwriteScholarshipDocument = Omit<Partial<Scholarship>, "quickFacts"> & {
  $id: string;
  quickFactsJson?: string;
  isPublished?: boolean;
};

type AppwriteDocumentsResponse = {
  total: number;
  documents: AppwriteScholarshipDocument[];
};

export async function fetchAppwriteScholarshipBySlug(slug: string) {
  const query = new URLSearchParams();
  query.append("queries[]", JSON.stringify({ method: "equal", attribute: "slug", values: [slug] }));
  query.append("queries[]", JSON.stringify({ method: "equal", attribute: "isPublished", values: [true] }));
  query.append("queries[]", JSON.stringify({ method: "limit", values: [1] }));

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
  const [document] = payload.documents;
  return document ? toScholarship(document) : undefined;
}

function toScholarship(document: AppwriteScholarshipDocument): Scholarship | undefined {
  if (!document.slug || !document.title || !document.summary) return undefined;

  return {
    slug: document.slug,
    title: document.title,
    provider: document.provider ?? "",
    hostCountries: arrayOrEmpty(document.hostCountries),
    fundingType: document.fundingType ?? "",
    applicationFee: document.applicationFee ?? "",
    languageNote: document.languageNote ?? "",
    summary: document.summary,
    quickFacts: parseQuickFacts(document.quickFactsJson),
    benefits: arrayOrEmpty(document.benefits),
    eligibility: arrayOrEmpty(document.eligibility),
    studyLevels: arrayOrEmpty(document.studyLevels),
    fields: arrayOrEmpty(document.fields),
    documents: arrayOrEmpty(document.documents),
    process: arrayOrEmpty(document.process),
    importantNotes: arrayOrEmpty(document.importantNotes),
    sendingPartners: arrayOrEmpty(document.sendingPartners),
    officialUrl: document.officialUrl ?? "",
  };
}

function arrayOrEmpty(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function parseQuickFacts(value: string | undefined) {
  if (!value) return [];

  try {
    const facts = JSON.parse(value);
    if (!Array.isArray(facts)) return [];

    return facts.filter(
      (fact): fact is { label: string; value: string } =>
        typeof fact?.label === "string" && typeof fact?.value === "string",
    );
  } catch {
    return [];
  }
}
