import { createHash } from 'node:crypto';

// Shared database counters enforce limits across cold starts and concurrent instances.
// Never fall back to memory if the database is unavailable.
export async function consumeQuota({ endpoint, project, key, userId, scope, limit, windowMs = 60000, now = Date.now(), request = fetch }) {
  if (!key) throw new Error('Rate limit service unavailable.');
  const window = Math.floor(now / windowMs);
  const documentId = createHash('sha256').update(`${scope}:${userId}:${window}`).digest('hex').slice(0, 36);
  const root = `${endpoint}/databases/unispora/collections/security_rate_limits/documents`;
  const headers = { 'X-Appwrite-Project': project, 'X-Appwrite-Key': key, 'Content-Type': 'application/json' };
  const call = (url, method, body) => request(url, { method, headers, signal: AbortSignal.timeout(8000), body: JSON.stringify(body) });
  const created = await call(root, 'POST', { documentId, permissions: [], data: { count: 1, expiresAt: new Date((window + 1) * windowMs).toISOString() } });
  if (created.ok) return true;
  if (created.status !== 409) throw new Error('Rate limit service unavailable.');
  const incremented = await call(`${root}/${documentId}/count/increment`, 'PATCH', { value: 1, max: limit });
  if (incremented.ok) return true;
  if (incremented.status === 400) return false;
  throw new Error('Rate limit service unavailable.');
}
