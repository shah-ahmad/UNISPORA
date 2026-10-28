// Disposable accounts only. No verification emails or Gemini calls are sent.
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { consumeQuota } from '../appwrite/functions/ai-advisor/rateLimit.js';
const endpoint = process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const project = process.env.APPWRITE_PROJECT_ID || '6a25cb6500103eec5cb3';
const key = process.env.APPWRITE_API_KEY;
if (!key) throw new Error('APPWRITE_API_KEY required.');
const cleanup = [];
async function call(path, method = 'GET', body, jwt) {
  return fetch(endpoint + path, { method, signal: AbortSignal.timeout(15000), headers: { 'X-Appwrite-Project': project, 'Content-Type': 'application/json', ...(jwt === undefined ? { 'X-Appwrite-Key': key } : jwt ? { 'X-Appwrite-JWT': jwt } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
async function must(...args) {
  const response = await call(...args);
  if (!response.ok) throw new Error(`Test request failed: HTTP ${response.status} on ${args[0]}`);
  return response.status === 204 ? {} : response.json();
}
try {
  const tokens = [];
  const users = [];
  for (let i = 0; i < 2; i++) {
    const userId = randomUUID(); users.push(userId);
    await must('/users', 'POST', { userId, email: `security-${userId}@example.invalid`, password: randomUUID() + 'aA9!', name: 'Disposable security test' });
    cleanup.push(() => must('/users/' + userId, 'DELETE'));
    await must('/users/' + userId + '/verification', 'PATCH', { emailVerification: true });
    const session = await must('/users/' + userId + '/sessions', 'POST', {});
    tokens.push((await must('/users/' + userId + '/jwts', 'POST', { sessionId: session.$id, duration: 900 })).jwt);
  }
  const docId = 'test-' + randomUUID().slice(0, 24);
  const path = '/databases/unispora/collections/usernames/documents/' + docId;
  await must('/databases/unispora/collections/usernames/documents', 'POST', { documentId: docId, data: { username: docId }, permissions: [`read("user:${users[0]}")`, `delete("user:${users[0]}")`] }, tokens[0]);
  cleanup.push(() => must(path, 'DELETE'));
  assert.equal((await call(path, 'GET', undefined, tokens[0])).status, 200);
  for (const token of [tokens[1], '']) {
    assert.ok([401,403,404].includes((await call(path, 'GET', undefined, token)).status));
    assert.ok([401,403,404].includes((await call(path, 'DELETE', undefined, token)).status));
  }
  const denied = await call('/functions/unispora-admin/executions', 'POST', { body: JSON.stringify({ action: 'listUsers' }), async: false, method: 'POST' }, tokens[1]);
  assert.ok([401,403].includes(denied.status));
  console.log('Owner read succeeds; anonymous/other-user read and deletion denied; non-admin execution denied.');
  const now = Date.now(), scope = 'audit-' + randomUUID();
  const id = createHash('sha256').update(`${scope}:${users[0]}:${Math.floor(now / 60000)}`).digest('hex').slice(0,36);
  cleanup.push(() => must('/databases/unispora/collections/security_rate_limits/documents/' + id, 'DELETE'));
  const results = await Promise.all(Array.from({ length: 8 }, () => consumeQuota({ endpoint, project, key, userId: users[0], scope, limit: 5, now })));
  assert.equal(results.filter(Boolean).length, 5);
  console.log('Real Appwrite atomic quota: exactly 5 of 8 concurrent attempts accepted.');
} finally {
  const failures = [];
  for (const remove of cleanup.reverse()) { try { await remove(); } catch (error) { failures.push(error); } }
  if (failures.length) throw new Error(`${failures.length} disposable test resources need cleanup.`);
  console.log('Disposable records and accounts removed.');
}
