import { useEffect, useState } from 'react';
import { Query } from 'appwrite';
import { databases } from '@/lib/appwrite';
import { catalogDatabase, type CatalogDocument } from '@/lib/catalog';
export function useWebsiteContent(collection: 'site_content' | 'announcements') {
  const [records, setRecords] = useState<CatalogDocument[]>([]);
  useEffect(() => {
    let active = true;
    databases.listDocuments({ databaseId: catalogDatabase, collectionId: collection, queries: [Query.equal('isPublished', true), Query.limit(100)] })
      .then(result => { if (active) setRecords((result.documents as CatalogDocument[]).sort((a,b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))); })
      .catch(() => { /* Retain the original introduction if content is unavailable. */ });
    return () => { active = false; };
  }, [collection]);
  return records;
}
