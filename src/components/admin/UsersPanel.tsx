import { useEffect, useState } from 'react';
import { adminRequest, type AdminUser } from '@/lib/admin';
import { listCatalog, type CatalogDocument } from '@/lib/catalog';
export function UsersPanel({ onDirty }: { onDirty: (value: boolean) => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selected, setSelected] = useState<AdminUser>();
  const [plans, setPlans] = useState<CatalogDocument[]>([]);
  const [access, setAccess] = useState<CatalogDocument[]>([]);
  const [query, setQuery] = useState(''); const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0); const [total, setTotal] = useState(0);
  const [version, setVersion] = useState(0); const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false); const [dirty, setDirty] = useState(false);
  const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const [planId, setPlanId] = useState(''); const [expires, setExpires] = useState('');
  const [status, setStatus] = useState('active'); const [note, setNote] = useState('');
  useEffect(() => { onDirty(dirty || busy); return () => onDirty(false); }, [dirty, busy, onDirty]);
  useEffect(() => { const warn = (e: BeforeUnloadEvent) => { if (dirty || busy) { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty, busy]);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    Promise.all([adminRequest({ action:'listUsers', offset, search }), listCatalog('premium_plans'), listCatalog('admin_subscriptions')])
      .then(([page, plans, access]) => { if (active) { setUsers(page.users || []); setTotal(page.total || 0); setPlans(plans); setAccess(access); } })
      .catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [offset, search, version]);
  const canLeave = () => !busy && (!dirty || window.confirm('Discard unsaved premium access changes?'));
  function choose(user: AdminUser) {
    if (!canLeave()) return;
    const grant = access.find(row => row.userId === user.$id);
    setSelected(user); setPlanId(String(grant?.planId || '')); setExpires(grant?.expiresAt ? new Date(String(grant.expiresAt)).toISOString().slice(0,16) : ''); setStatus(String(grant?.status || 'active')); setNote(String(grant?.note || '')); setDirty(false); setMessage('');
  }
  async function toggleStatus() {
    if (!selected || busy || !window.confirm(`${selected.status ? 'Block' : 'Unblock'} ${selected.email}? ${selected.status ? 'This stops authenticated account access and signs them out. Public pages remain available.' : 'They will be able to sign in again.'}`)) return;
    setBusy(true); setError(''); setMessage('');
    try { const response = await adminRequest({ action: 'setUserStatus', userId: selected.$id, status: !selected.status }); const updated = { ...selected, status: !selected.status }; setSelected(updated); setUsers(rows => rows.map(row => row.$id === updated.$id ? updated : row)); setMessage(response.warning || (updated.status ? 'User unblocked.' : 'User blocked and sessions revoked.')); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not change access.'); } finally { setBusy(false); }
  }
  async function saveAccess(event: React.FormEvent) {
    event.preventDefault(); if (!selected || busy) return; setBusy(true); setError(''); setMessage('');
    try { const response = await adminRequest<CatalogDocument>({ action:'grantAccess', data:{ userId:selected.$id, planId, expiresAt:new Date(expires + 'Z').toISOString(), status, note } }); setAccess(rows => [...rows.filter(row => row.userId !== selected.$id), response.result]); setDirty(false); setMessage(response.warning || 'Premium access record saved. No payment was taken.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not save access.'); } finally { setBusy(false); }
  }
  return <section><h2 className="admin-section-title">Users & access</h2><p className="admin-help">Search accounts, manage access, and record manual premium grants. Blocking prevents sign-in and authenticated actions, not visits to public pages.</p>
    <form className="admin-search" onSubmit={event => { event.preventDefault(); if (canLeave()) { setSearch(query); setOffset(0); setSelected(undefined); setDirty(false); setVersion(v => v + 1); } }}><input className="lux-input" aria-label="Search users" placeholder="Search name or email" value={query} onChange={e => setQuery(e.target.value)} /><button className="panel-action" disabled={loading || busy}>Search users</button></form>
    {error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-message" role="status">{message}</p>}
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Role</th><th>Email</th><th>Access</th><th>Manage</th></tr></thead><tbody>{users.map(user => <tr key={user.$id}><td>{user.name || 'Unnamed user'}<small>{user.email}</small></td><td>{user.role}</td><td>{user.emailVerification ? 'Verified' : 'Unverified'}</td><td>{user.status ? 'Active' : 'Blocked'}</td><td><button className="panel-action" disabled={busy || loading} onClick={() => choose(user)}>Manage {user.name || user.email}</button></td></tr>)}</tbody></table></div>
    <p aria-live="polite">{loading ? 'Loading users…' : total ? `${offset + 1}–${Math.min(offset + 25, total)} of ${total} users` : 'No matching users.'}</p>
    <div className="admin-actions"><button className="panel-action" disabled={loading || busy || !offset} onClick={() => { if (canLeave()) { setSelected(undefined); setDirty(false); setOffset(v => v - 25); } }}>Previous</button><button className="panel-action" disabled={loading || busy || offset + 25 >= total} onClick={() => { if (canLeave()) { setSelected(undefined); setDirty(false); setOffset(v => v + 25); } }}>Next</button></div>
    {selected && <div className="admin-editor"><h2>{selected.name || selected.email}</h2><p>{selected.email} · {selected.country || 'Country not set'}</p><p className="admin-help">Joined {new Date(selected.createdAt).toLocaleDateString()} · {selected.role}</p>
      <button className="panel-action admin-delete" disabled={busy || selected.role === 'admin'} onClick={() => void toggleStatus()}>{selected.status ? 'Block account' : 'Unblock account'}</button>{selected.role === 'admin' && <p className="admin-help">Administrator accounts are protected from blocking.</p>}
      <form onSubmit={saveAccess}><h3 className="admin-section-title">Manual premium access</h3><p className="admin-help">Records an entitlement for future premium features. No checkout, charges, or feature restrictions are enabled yet.</p>
        {plans.length ? <><fieldset disabled={busy} onChange={() => setDirty(true)}><label>Plan<select required value={planId} onChange={e => setPlanId(e.target.value)}><option value="">Select a plan</option>{plans.map(plan => <option key={plan.$id} value={plan.$id}>{String(plan.name)} ({String(plan.status)})</option>)}</select></label><label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="active">Active</option><option value="revoked">Revoked</option></select></label><label>Expires at (UTC)<input required type="datetime-local" value={expires} onChange={e => setExpires(e.target.value)} /></label><label>Internal note<textarea maxLength={1000} value={note} onChange={e => setNote(e.target.value)} /></label></fieldset><p className="admin-help">Active records stop being valid after their expiry date.</p><button className="panel-action primary" disabled={busy || !dirty}>Save premium access</button></> : <p>Create a plan in Premium plans first.</p>}
      </form></div>}
  </section>;
}
