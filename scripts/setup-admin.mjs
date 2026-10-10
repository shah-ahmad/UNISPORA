// Run with APPWRITE_API_KEY in the environment. Never put keys in source.
import { readFileSync } from 'node:fs';
const endpoint = process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const project = process.env.APPWRITE_PROJECT_ID || '6a25cb6500103eec5cb3';
if (!process.env.APPWRITE_API_KEY) throw new Error('APPWRITE_API_KEY is required.');
const schema = JSON.parse(readFileSync(new URL('../appwrite/functions/admin/schema.json', import.meta.url)));
const root = '/databases/unispora/collections';
async function api(path, method = 'GET', body) {
  const response = await fetch(endpoint + path, { method, headers: { 'X-Appwrite-Project': project, 'X-Appwrite-Key': process.env.APPWRITE_API_KEY, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!response.ok) { const e = new Error((await response.json().catch(() => ({}))).message || `HTTP ${response.status}: ${path}`); e.status = response.status; throw e; }
  return response.status === 204 ? {} : response.json();
}
for (const [collectionId, config] of Object.entries(schema)) {
  let collection;
  const permissions = [config.published || config.private || collectionId === 'premium_plans' ? 'read("label:admin")' : 'read("any")'];
  try { collection = await api(root + '/' + collectionId); }
  catch (e) { if (e.status !== 404) throw e; collection = await api(root, 'POST', { collectionId, name: config.label, permissions, documentSecurity: !!config.published }); }
  if (!process.env.ADMIN_LOCK_WRITES && ['universities', 'consultants'].includes(collectionId)) permissions.push('create("label:admin")', 'update("label:admin")', 'delete("label:admin")');
  // All writes now go through the authenticated admin function and its audit trail.
  await api(root + '/' + collectionId, 'PUT', { name: config.label, permissions, documentSecurity: !!config.published, enabled: true });
  for (const field of config.fields) {
    if (collection.attributes.some(a => a.key === field.key)) continue;
    const type = field.type === 'double' ? 'float' : field.type;
    const body = { key: field.key, required: !!field.required, array: !!field.array };
    if (type === 'string') body.size = field.size || 1024;
    if (field.elements) body.elements = field.elements;
    if (field.min != null) body.min = field.min;
    if (field.max != null) body.max = field.max;
    await api(root + '/' + collectionId + '/attributes/' + type, 'POST', body);
  }
  for (let attempt = 0; attempt < 30; attempt++) {
    const latest = await api(root + '/' + collectionId);
    if (latest.attributes.every(a => a.status === 'available')) break;
    if (latest.attributes.some(a => ['failed','stuck'].includes(a.status))) throw new Error('Attribute creation failed: ' + collectionId);
    if (attempt === 29) throw new Error('Attributes are not ready: ' + collectionId);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (config.published) {
    let offset = 0;
    for (;;) {
      const query = new URLSearchParams([['queries[]', JSON.stringify({ method:'limit',values:[100] })],['queries[]', JSON.stringify({ method:'offset',values:[offset] })]]);
      const page = await api(root + '/' + collectionId + '/documents?' + query);
      for (const doc of page.documents) await api(root + '/' + collectionId + '/documents/' + doc.$id, 'PATCH', { permissions: doc.isPublished ? ['read("any")'] : [] });
      if (page.documents.length < 100) break;
      offset += 100;
    }
  }
  console.log(collectionId + ': ready');
}
const heroPath = root + '/site_content/documents';
try { await api(heroPath + '/main-hero'); }
catch (e) {
  if (e.status !== 404) throw e;
  const source = readFileSync(new URL('../src/components/layout/SidebarHero.tsx', import.meta.url), 'utf8');
  const body = source.match(/<p>(UniSpora helps[^<]+)<\/p>/)?.[1];
  if (body) await api(heroPath, 'POST', { documentId:'main-hero', permissions:['read("any")'], data:{name:'Main website introduction',placement:'hero',title:'Where Ambitions Go Global',body,isPublished:true,sortOrder:0} });
}
