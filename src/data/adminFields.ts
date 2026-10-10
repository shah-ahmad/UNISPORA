import schema from "../../appwrite/functions/admin/schema.json";
export type Field = { key: string; type: string; required?: boolean; array?: boolean; size?: number; min?: number; max?: number; format?: string; elements?: string[] };
export type CatalogConfig = { label: string; kind: string; fields: Field[]; published?: boolean; private?: boolean; note?: string };
export const catalogs: Record<string, CatalogConfig> = schema;
export const universityFields = catalogs.universities.fields;
export const consultantFields = catalogs.consultants.fields;
