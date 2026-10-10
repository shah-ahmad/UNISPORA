import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Query } from 'appwrite';
import { AppShell } from '@/components/layout/AppShell';
import { databases } from '@/lib/appwrite';
import { catalogDatabase, type CatalogDocument } from '@/lib/catalog';
export const Route = createFileRoute('/scholarships/')({ component: Scholarships });
function Scholarships() {
  const [records, setRecords] = useState<CatalogDocument[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    async function load() {
      const all: CatalogDocument[] = [];
      for (;;) {
        const page = await databases.listDocuments({ databaseId: catalogDatabase, collectionId: 'scholarships', queries: [Query.equal('isPublished', true), Query.orderAsc('$id'), Query.limit(100), ...(all.length ? [Query.cursorAfter(all.at(-1)!.$id)] : [])] });
        all.push(...page.documents as CatalogDocument[]); if (page.documents.length < 100) break;
      }
      if (active) setRecords(all);
    }
    load().catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <AppShell><section className="page-container"><h1>Scholarships</h1><p>Explore funding opportunities and application guides.</p>{loading && <p>Loading scholarships…</p>}{error && <p role="alert">Could not load scholarships. Please refresh to try again.</p>}{!loading && !error && !records.length && <p>New guides are coming soon.</p>}{records.map(row => <article className="website-content-card" key={row.$id}><h2>{String(row.title)}</h2><p>{String(row.summary)}</p><Link to="/scholarships/$slug" params={{slug:String(row.slug)}}>Read scholarship guide</Link></article>)}</section></AppShell>;
}
