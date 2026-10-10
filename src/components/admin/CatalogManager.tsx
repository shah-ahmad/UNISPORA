import { useEffect, useState } from "react";
import { adminRequest } from "@/lib/admin";
import { listCatalog, type CatalogDocument } from "@/lib/catalog";
import { catalogs, type Field } from "@/data/adminFields";
export function CatalogManager({ collection, onDirty }: { collection: string; onDirty: (value: boolean) => void }) {
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
  const { fields, kind, note } = catalogs[collection];
  useEffect(() => { onDirty(dirty || busy); return () => onDirty(false); }, [dirty, busy, onDirty]);
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
    setValues(Object.fromEntries(fields.map(field => [field.key, Array.isArray(row?.[field.key]) ? (row![field.key] as string[]).join("\n") : field.format === "facts" ? formatFacts(row?.[field.key]) : String(row?.[field.key] ?? (field.type === "boolean" ? "false" : ""))])));
    setDirty(false); setError(""); setMessage("");
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !selected) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const data = Object.fromEntries(fields.map(field => [field.key, parseField(field, values[field.key] ?? "")]));
      const response = await adminRequest<CatalogDocument>({ action: "save", collection, documentId: selected === "new" ? undefined : selected, data });
      const saved = response.result;
      setRecords(current => [...current.filter(row => row.$id !== saved.$id), saved as CatalogDocument]);
      setSelected(saved.$id); setDirty(false); setMessage(response.warning || (catalogs[collection].published ? "Saved. Published records are live; drafts remain private." : collection === "premium_plans" ? "Plan saved. Payments remain disabled." : "Saved. Changes are now available on the public website."));
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed. Your edits have been kept."); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!selected || selected === "new" || !window.confirm(`Delete ${values.name || "this record"}? It will be removed from the public website. This cannot be undone here.`)) return;
    setBusy(true); setError("");
    try {
      await adminRequest({ action: "delete", collection, documentId: selected });
      setRecords(rows => rows.filter(row => row.$id !== selected)); setSelected(undefined); setDirty(false); setMessage("Record deleted.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not delete record."); }
    finally { setBusy(false); }
  }
  return <>
    <h2 className="admin-section-title">{catalogs[collection].label}</h2>
    {note ? <p className="admin-help">{note}</p> : null}
    {error ? <p className="admin-error" role="alert">{error}</p> : null}
    {message ? <p className="admin-message" role="status">{message}</p> : null}
    <div className="admin-layout"><aside className="admin-list">
      <input className="lux-input" aria-label="Search directory" placeholder="Search by name or country…" value={search} onChange={event => setSearch(event.target.value)} />
      <button type="button" className="panel-action primary" disabled={busy || loading} onClick={() => choose()}>Add {kind}</button>
      <button type="button" className="panel-action" disabled={busy || loading} onClick={() => { if (canLeave()) { setSelected(undefined); setDirty(false); setVersion(v => v + 1); } }}>Refresh records</button>
      {loading ? <p>Loading…</p> : <p>{records.length} records</p>}
      <div className="admin-records">{records.filter(row => `${row.name ?? row.title} ${row.country ?? ""}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => String(a.name ?? a.title).localeCompare(String(b.name ?? b.title))).map(row => <button type="button" disabled={busy} key={row.$id} aria-pressed={selected === row.$id} onClick={() => choose(row)}><strong>{String(row.name ?? row.title)}</strong><small>{String(row.isPublished === undefined ? row.country ?? row.badge ?? row.status ?? "" : row.isPublished ? "Published" : "Draft")}</small></button>)}</div>
    </aside>
    {selected ? <form className="admin-editor" onSubmit={save}><h2>{selected === "new" ? `Add ${kind}` : `Edit ${kind}`}</h2>{collection === "scholarships" && selected !== "new" && values.isPublished === "true" ? <p className="admin-help"><a href={`/scholarships/${encodeURIComponent(values.slug)}`} target="_blank" rel="noreferrer">Open published guide</a></p> : null}<fieldset disabled={busy}>
      {fields.map(field => <label key={field.key}><span>{(field.format === "facts" ? "Quick facts" : field.type === "boolean" ? "Publication status" : field.key).replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}{field.required ? " *" : ""}</span>
        {field.type === "boolean" ? <select value={values[field.key] ?? "false"} onChange={event => { setValues(v => ({ ...v, [field.key]: event.target.value })); setDirty(true); }}><option value="false">Draft</option><option value="true">Published</option></select> : field.array || field.format === "facts" || (field.size ?? 0) >= 1000 ? <textarea rows={field.array ? 3 : 5} value={values[field.key] ?? ""} required={field.required && !field.array} maxLength={field.array ? undefined : field.size} onChange={event => { setValues(v => ({ ...v, [field.key]: event.target.value })); setDirty(true); }} /> : field.elements ? <select value={values[field.key] ?? ""} required={field.required} onChange={event => { setValues(v => ({ ...v, [field.key]: event.target.value })); setDirty(true); }}><option value="">Choose…</option>{field.elements.map(value => <option key={value}>{value}</option>)}</select> : <input type={field.type === "integer" || field.type === "double" ? "number" : field.format === "url" ? "url" : "text"} step={field.type === "double" ? "any" : 1} min={field.min} max={field.max} maxLength={field.size} required={field.required} value={values[field.key] ?? ""} placeholder={field.type === "datetime" ? "2026-10-10T00:00:00.000Z" : undefined} onChange={event => { setValues(v => ({ ...v, [field.key]: event.target.value })); setDirty(true); }} />}
        {field.format === "facts" ? <small>One fact per line: label | value</small> : null}{field.array ? <small>One item per line.</small> : null}</label>)}
    </fieldset><div className="admin-actions"><button type="submit" className="panel-action primary" disabled={busy || (selected !== "new" && !dirty)}>{busy ? "Please wait…" : "Save changes"}</button><button type="button" className="panel-action" disabled={busy} onClick={() => { if (canLeave()) { setSelected(undefined); setDirty(false); } }}>Cancel</button>{selected !== "new" ? <button type="button" className="panel-action admin-delete" disabled={busy} onClick={() => void remove()}>Delete</button> : null}</div></form> : <div className="admin-editor"><h2>Select a record to edit</h2><p>Or add a new {kind} using the button on the left.</p></div>}
    </div>
  </>;
}

export function parseField(field: Field, raw: string): unknown {
  const value = raw.trim();
  if (field.required && !field.array && !value) throw new Error(`${field.key} is required.`);
  if (field.type === "boolean") return value === "true";
  if (field.format === "facts") {
    const facts = value.split("\n").filter(line => line.trim()).map(line => { const at = line.indexOf("|"); if (at < 1 || !line.slice(at + 1).trim()) throw new Error("Quick facts need label | value on each line."); return { label: line.slice(0, at).trim(), value: line.slice(at + 1).trim() }; });
    return JSON.stringify(facts);
  }
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

function formatFacts(value: unknown) { try { return (JSON.parse(String(value || "[]")) as {label:string;value:string}[]).map(f => `${f.label} | ${f.value}`).join("\n"); } catch { return ""; } }
