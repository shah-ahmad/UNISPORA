import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { safeExternalUrl } from '../src/lib/safeUrl.ts';
import { consumeQuota } from '../appwrite/functions/ai-advisor/rateLimit.js';

test('database links reject executable schemes, controls and credentials', () => {
  for (const value of ['javascript:alert(1)', 'data:text/html,test', '//evil.test', 'https://user:pass@example.test', 'https://exa\nmple.test', 'https://', null]) assert.equal(safeExternalUrl(value), undefined);
  assert.equal(safeExternalUrl('https://example.test/path?q=1'), 'https://example.test/path?q=1');
});
test('distributed quota caps concurrent requests and isolates users and windows', async () => {
  const counters = new Map();
  const request = async (url, options) => {
    const body = JSON.parse(options.body);
    if (options.method === 'POST') {
      if (counters.has(body.documentId)) return new Response('{}', { status: 409 });
      assert.deepEqual(body.permissions, []);
      counters.set(body.documentId, 1); return new Response('{}', { status: 201 });
    }
    const id = url.split('/').at(-3);
    const next = counters.get(id) + body.value;
    if (next > body.max) return new Response('{}', { status: 400 });
    counters.set(id, next); return new Response('{}');
  };
  const settings = { endpoint: 'https://test.invalid/v1', project: 'test', key: 'test', userId: 'one', scope: 'chat', limit: 5, now: 60000, request };
  assert.equal((await Promise.all(Array.from({ length: 20 }, () => consumeQuota(settings)))).filter(Boolean).length, 5);
  assert.equal(await consumeQuota({ ...settings, userId: 'two' }), true);
  assert.equal(await consumeQuota({ ...settings, now: 120000 }), true);
});
test('quota fails closed on storage failures and missing credentials', async () => {
  await assert.rejects(consumeQuota({ key: '' }));
  await assert.rejects(consumeQuota({ key: 'test', request: async () => new Response('{}', { status: 500 }) }));
});
test('independently packaged functions use the same quota implementation', () => {
  assert.equal(readFileSync('appwrite/functions/admin/rateLimit.js', 'utf8'), readFileSync('appwrite/functions/ai-advisor/rateLimit.js', 'utf8'));
});
