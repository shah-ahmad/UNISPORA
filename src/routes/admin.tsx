import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ID } from "appwrite";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { databases } from "@/lib/appwrite";
import { catalogDatabase, listCatalog, universityCollection, type CatalogDocument } from "@/lib/catalog";
import { universityFields, consultantFields, type Field } from "@/data/adminFields";

export const Route = createFileRoute("/admin")({ component: Admin });

function Admin() {
  const { user, loading } = useAuth();
  return <AppShell><div className="page-container admin-page">
    {loading ? <p>Checking access…</p> : !user ? <><h1>Admin sign in</h1><p>Log in with your administrator account to manage UniSpora.</p><Link to="/login" className="panel-action primary">Go to sign in</Link></> : !user.emailVerification || !user.labels.includes("admin") ? <><h1>Admin access required</h1><p>This account does not have permission to manage UniSpora.</p></> : <CatalogManager />}
  </div></AppShell>;
}

function CatalogManager() {
  const [collection, setCollection] = useState(universityCollection);
  const [records, setRecords] = useState<CatalogDocument[]>([]);
  const [selected, setSelected] = useState<string>();
  const [values, setValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const fields = collection === universityCollection ? universityFields : consultantFields;
  const kind = collection === universityCollection ? "university" : "consultant";
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    listCatalog(collection).then(rows => { if (active) setRecords(rows); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : "Could not load records."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [collection, version]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const canLeave = () => !dirty || window.confirm("Discard your unsaved changes?");
  function choose(row?: CatalogDocument) {
    if (!canLeave()) return;
    setSelected(row?.$id ?? "new");
    setValues(Object.fromEntries(fields.map(field => [field.key, Array.isArray(row?.[field.key]) ? (row![field.key] as string[]).join("\n") : String(row?.[field.key] ?? "")])));
    setDirty(false); setError(""); setMessage("");
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !selected) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const data = Object.fromEntries(fields.map(field => [field.key, parseField(field, values[field.key] ?? "")]));
      const args = { databaseId: catalogDatabase, collectionId: collection, data };
      const saved = selected === "new" ? await databases.createDocument({ ...args, documentId: ID.unique(), permissions: [] }) : await databases.updateDocument({ ...args, documentId: selected });
      setRecords(current => [...current.filter(row => row.$id !== saved.$id), saved as CatalogDocument]);
      setSelected(saved.$id); setDirty(false); setMessage("Saved. Changes are now available on the public website.");
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed. Your edits have been kept."); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!selected || selected === "new" || !window.confirm(`Delete ${values.name || "this record"}? It will be removed from the public website. This cannot be undone here.`)) return;
    setBusy(true); setError("");
    try {
      await databases.deleteDocument({ databaseId: catalogDatabase, collectionId: collection, documentId: selected });
      setRecords(rows => rows.filter(row => row.$id !== selected)); setSelected(undefined); setDirty(false); setMessage("Record deleted.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not delete record."); }
    finally { setBusy(false); }
  }
  return <>
    <header className="page-header"><p>UniSpora administration</p><h1>Manage your directory</h1><p>Edit university information and consultant profiles. Save to publish your changes.</p></header>
    <div className="admin-tabs">{[[universityCollection, "Universities"], ["consultants", "Consultants"]].map(([id, label]) => <button type="button" key={id} disabled={busy} aria-pressed={collection === id} className={`panel-action ${collection === id ? "primary" : ""}`} onClick={() => { if (collection !== id && canLeave()) { setCollection(id); setSelected(undefined); setRecords([]); setSearch(""); setDirty(false); setMessage(""); } }}>{label}</button>)}</div>
    {error ? <p className="admin-error" role="alert">{error}</p> : null}
    {message ? <p className="admin-message" role="status">{message}</p> : null}
    <div className="admin-layout"><aside className="admin-list">
      <input className="lux-input" aria-label="Search directory" placeholder="Search by name or country…" value={search} onChange={event => setSearch(event.target.value)} />
      <button type="button" className="panel-action primary" disabled={busy || loading} onClick={() => choose()}>Add {kind}</button>
      <button type="button" className="panel-action" disabled={busy || loading} onClick={() => { if (canLeave()) { setSelected(undefined); setDirty(false); setVersion(v => v + 1); } }}>Refresh records</button>
      {loading ? <p>Loading…</p> : <p>{records.length} records</p>}
      <div className="admin-records">{records.filter(row => `${row.name} ${row.country ?? ""}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => String(a.name).localeCompare(String(b.name))).map(row => <button type="button" disabled={busy} key={row.$id} aria-pressed={selected === row.$id} onClick={() => choose(row)}><strong>{String(row.name)}</strong><small>{String(row.country ?? row.badge ?? "")}</small></button>)}</div>
    </aside>
    {selected ? <form className="admin-editor" onSubmit={save}><h2>{selected === "new" ? `Add ${kind}` : `Edit ${kind}`}</h2><fieldset disabled={busy}>
      {fields.map(field => <label key={field.key}><span>{field.key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}{field.required ? " *" : ""}</span>
        {field.array || ["description", "bio", "tuitionDetails"].includes(field.key) ? <textarea rows={field.array ? 3 : 5} value={values[field.key] ?? ""} required={field.required} maxLength={field.array ? undefined : field.size} onChange={event => { setValues(v => ({ ...v, [field.key]: event.target.value })); setDirty(true); }} /> : field.elements ? <select value={values[field.key] ?? ""} required={field.required} onChange={event => { setValues(v => ({ ...v, [field.key]: event.target.value })); setDirty(true); }}><option value="">Choose…</option>{field.elements.map(value => <option key={value}>{value}</option>)}</select> : <input type={field.type === "integer" || field.type === "double" ? "number" : field.format === "url" ? "url" : "text"} step={field.type === "double" ? "any" : 1} min={field.min} max={field.max} maxLength={field.size} required={field.required} value={values[field.key] ?? ""} placeholder={field.type === "datetime" ? "2026-10-10T00:00:00.000Z" : undefined} onChange={event => { setValues(v => ({ ...v, [field.key]: event.target.value })); setDirty(true); }} />}
        {field.array ? <small>One item per line.</small> : null}</label>)}
    </fieldset><div className="admin-actions"><button type="submit" className="panel-action primary" disabled={busy || (selected !== "new" && !dirty)}>{busy ? "Please wait…" : "Save changes"}</button><button type="button" className="panel-action" disabled={busy} onClick={() => { if (canLeave()) { setSelected(undefined); setDirty(false); } }}>Cancel</button>{selected !== "new" ? <button type="button" className="panel-action admin-delete" disabled={busy} onClick={() => void remove()}>Delete</button> : null}</div></form> : <div className="admin-editor"><h2>Select a record to edit</h2><p>Or add a new {kind} using the button on the left.</p></div>}
    </div>
  </>;
}

export function parseField(field: Field, raw: string): unknown {
  const value = raw.trim();
  if (field.required && !value) throw new Error(`${field.key} is required.`);
  if (field.array) {
    const items = value.split("\n").map(item => item.trim()).filter(Boolean);
    if (field.size && items.some(item => item.length > field.size!)) throw new Error(`${field.key}: each item must be under ${field.size} characters.`);
    return items;
  }
  if (!value) return null;
  if (field.type === "integer" || field.type === "double") {
    const number = Number(value);
    if (!Number.isFinite(number) || (field.type === "integer" && !Number.isInteger(number)) || (field.min !== undefined && number < field.min) || (field.max !== undefined && number > field.max)) throw new Error(`Invalid ${field.key}.`);
    return number;
  }
  if (field.type === "datetime") { const date = new Date(value); if (Number.isNaN(date.valueOf())) throw new Error(`Invalid date for ${field.key}.`); return date.toISOString(); }
  if (field.format === "url") { const url = new URL(value); if (!["https:", "http:"].includes(url.protocol)) throw new Error("Use an http or https URL."); }
  if (field.elements && !field.elements.includes(value)) throw new Error(`Invalid ${field.key}.`);
  if (field.size && value.length > field.size) throw new Error(`${field.key} is too long.`);
  return value;
}
