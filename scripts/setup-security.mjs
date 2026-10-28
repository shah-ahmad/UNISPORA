// Run before deploying the hardened functions. Keys must be provided through the environment.
const endpoint = process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const project = process.env.APPWRITE_PROJECT_ID || '6a25cb6500103eec5cb3';
const key = process.env.APPWRITE_API_KEY;
if (!key) throw new Error('APPWRITE_API_KEY is required.');
async function api(path, method = 'GET', body) {
  const response = await fetch(endpoint + path, { method, signal: AbortSignal.timeout(15000), headers: { 'X-Appwrite-Project': project, 'X-Appwrite-Key': key, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!response.ok) throw Object.assign(new Error(`Security setup failed: HTTP ${response.status}`), { status: response.status });
  return response.status === 204 ? {} : response.json();
}
const root = '/databases/unispora/collections/security_rate_limits';
let collection;
try { collection = await api(root); } catch (error) {
  if (error.status !== 404) throw error;
  collection = await api('/databases/unispora/collections', 'POST', { collectionId: 'security_rate_limits', name: 'Security rate limits', permissions: [], documentSecurity: false });
}
await api(root, 'PUT', { name: 'Security rate limits', permissions: [], documentSecurity: false, enabled: true });
for (const [type, attribute] of [['integer', { key: 'count', required: true, min: 0 }], ['datetime', { key: 'expiresAt', required: true }]]) {
  if (!collection.attributes.some(a => a.key === attribute.key)) await api(root + '/attributes/' + type, 'POST', attribute);
}
for (let attempt = 0; ; attempt++) {
  collection = await api(root);
  if (['count', 'expiresAt'].every(key => collection.attributes.some(a => a.key === key && a.status === 'available'))) break;
  if (attempt >= 20) throw new Error('Attributes are still building; rerun setup later.');
  await new Promise(resolve => setTimeout(resolve, 1000));
}
if (!collection.indexes.some(i => i.key === 'expiresAt')) await api(root + '/indexes', 'POST', { key: 'expiresAt', type: 'key', attributes: ['expiresAt'], orders: ['ASC'] });
// Enable the database scopes only as part of the function rollout.
if (process.env.SECURITY_ENABLE_FUNCTION_SCOPES === '1') {
  const fn = await api('/functions/unispora-ai-advisor');
  await api('/functions/unispora-ai-advisor', 'PUT', { name: fn.name, scopes: ['documents.read', 'documents.write'] });
}
// Run only AFTER deploying the new signup flow (the old flow reserves before login).
if (process.env.SECURITY_LOCK_USERNAMES === '1') {
  const registry = await api('/databases/unispora/collections/usernames');
  await api('/databases/unispora/collections/usernames', 'PUT', { name: registry.name, permissions: ['create("users/verified")'], documentSecurity: true, enabled: true });
}
// Optional maintenance: remove expired counters, never current quota windows.
if (process.env.SECURITY_CLEAN_COUNTERS === '1') {
  const before = new Date(Date.now() - 86400000).toISOString();
  for (;;) {
    const query = new URLSearchParams([
      ['queries[]', JSON.stringify({ method: 'lessThan', attribute: 'expiresAt', values: [before] })],
      ['queries[]', JSON.stringify({ method: 'limit', values: [100] })],
    ]);
    const page = await api(root + '/documents?' + query);
    if (!page.documents.length) break;
    for (const row of page.documents) await api(root + '/documents/' + row.$id, 'DELETE');
  }
}
console.log('Security infrastructure ready. No secret values were logged.');
