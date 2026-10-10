import { useEffect, useState } from 'react';
import { LayoutDashboard, GraduationCap, Users, Award, Crown, FileText, Megaphone, History } from 'lucide-react';
import { CatalogManager } from './CatalogManager';
import { UsersPanel } from './UsersPanel';
import { catalogs } from '@/data/adminFields';
import { databases } from '@/lib/appwrite';
import { catalogDatabase, type CatalogDocument } from '@/lib/catalog';
import { Query } from 'appwrite';
import { adminRequest } from '@/lib/admin';

const sections = [
  ['overview', 'Overview', LayoutDashboard], ['universities', 'Universities', GraduationCap],
  ['consultants', 'Consultants', Users], ['scholarships', 'Scholarships', Award],
  ['users', 'Users & access', Users], ['premium_plans', 'Premium plans', Crown],
  ['site_content', 'Website content', FileText], ['announcements', 'Announcements', Megaphone],
  ['activity', 'Activity log', History],
] as const;
export function AdminWorkspace() {
  const [section, setSection] = useState('overview');
  const [dirty, setDirty] = useState(false);
  const change = (next: string) => { if (next !== section && (!dirty || window.confirm('Leave this section and discard unsaved changes?'))) { setDirty(false); setSection(next); } };
  return <>
    <header className="page-header admin-heading"><p>UniSpora administration</p><h1>Your control centre</h1><p>Manage your directory, content, and community.</p></header>
    <nav className="admin-navigation" aria-label="Administration sections">{sections.map(([key, label, Icon]) => <button type="button" key={key} aria-current={section === key ? 'page' : undefined} onClick={() => change(key)}><Icon size={18} /><span>{label}</span></button>)}</nav>
    {section === 'overview' ? <Overview onSelect={change} /> : section === 'users' ? <UsersPanel onDirty={setDirty} /> : section === 'activity' ? <Activity /> : <CatalogManager key={section} collection={section} onDirty={setDirty} />}
  </>;
}
function Overview({ onSelect }: { onSelect: (section: string) => void }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.all(['universities', 'consultants', 'scholarships', 'premium_plans'].map(async key => {
      const result = await databases.listDocuments({ databaseId: catalogDatabase, collectionId: key, queries: [Query.limit(1)] });
      return [key, result.total] as const;
    })).then(async entries => {
      const users = await adminRequest({ action: 'listUsers' });
      if (active) setCounts(Object.fromEntries([...entries, ['users', users.total ?? 0]]));
    }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);
  return <section><h2 className="admin-section-title">Overview</h2>{error && <p role="alert" className="admin-error">{error}</p>}
    <div className="admin-overview">{['universities','consultants','scholarships','users','premium_plans'].map(key => <button key={key} onClick={() => onSelect(key)}><strong>{counts[key] ?? '—'}</strong><span>{catalogs[key]?.label || 'Registered users'}</span></button>)}</div>
    <div className="admin-editor"><h2>Ready for your next stage</h2><p>Prepare scholarship guides and website sections as drafts, then publish when they are ready. Manage manual premium access from each user's profile.</p><p className="admin-help">Payments are not connected. Plans and access records are preparation for premium features; they do not charge users or change AI limits.</p><p className="admin-help">Only administrators can open this workspace. Consultant accounts have no admin access.</p></div>
  </section>;
}
function Activity() {
  const [records, setRecords] = useState<CatalogDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    databases.listDocuments({ databaseId: catalogDatabase, collectionId: 'admin_activity', queries: [Query.orderDesc('$createdAt'), Query.limit(25), Query.offset(offset)] })
      .then(page => { if (active) { setRecords(page.documents as CatalogDocument[]); setTotal(page.total); } })
      .catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [offset, version]);
  return <section><h2 className="admin-section-title">Activity log</h2><p className="admin-help">Changes made through this dashboard are recorded here. Older changes and direct console edits are not included.</p>
    <button className="panel-action" disabled={loading} onClick={() => setVersion(v => v + 1)}>Refresh activity</button>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>When</th><th>Action</th><th>Record</th><th>Result</th></tr></thead><tbody>{records.map(row => <tr key={row.$id}><td>{new Date(row.$createdAt).toLocaleString()}<small>Admin: {String(row.actorId)}</small></td><td>{String(row.action)}</td><td>{String(row.detail || row.target)}<small>{String(row.target)}</small></td><td>{String(row.result)}</td></tr>)}</tbody></table></div>
    <p aria-live="polite">{loading ? 'Loading…' : total ? `${offset + 1}–${Math.min(offset + 25, total)} of ${total} events` : 'No activity yet.'}</p>
    <div className="admin-actions"><button className="panel-action" disabled={loading || !offset} onClick={() => setOffset(v => Math.max(0, v - 25))}>Previous</button><button className="panel-action" disabled={loading || offset + 25 >= total} onClick={() => setOffset(v => v + 25)}>Next</button></div>
  </section>;
}
