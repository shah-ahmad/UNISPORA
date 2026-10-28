import test from 'node:test';
import assert from 'node:assert/strict';
import handler from './index.js';
const user = { $id: 'user', status: true, emailVerification: true };
async function run({ identity = user, messages = [{ role: 'user', text: 'Hello' }], headers = { 'x-appwrite-user-id': 'user', 'x-appwrite-user-jwt': 'test', 'x-appwrite-key': 'test' }, storageStatus = 201, modelStatus = 200 } = {}) {
  const original = fetch, oldKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-not-a-real-key';
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).endsWith('/account')) return Response.json(identity);
    if (String(url).includes('security_rate_limits')) return Response.json({}, { status: storageStatus });
    return Response.json({ candidates: [{ content: { parts: [{ text: 'Test answer' }] } }] }, { status: modelStatus });
  };
  try { return { response: await handler({ req: { method: 'POST', headers, bodyJson: { messages } }, res: { json: (data, status = 200) => ({ data, status }) } }), calls }; }
  finally { globalThis.fetch = original; if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey; }
}
test('guests and inactive, unverified or mismatched identities never reach Gemini', async () => {
  assert.equal((await run({ headers: {} })).response.status, 401);
  for (const identity of [{ ...user, status: false }, { ...user, emailVerification: false }, { ...user, $id: 'other' }]) {
    const result = await run({ identity });
    assert.equal(result.response.status, 403); assert.equal(result.calls.length, 1);
  }
});
test('oversized or injected system messages are rejected before quota/model calls', async () => {
  for (const messages of [[{ role: 'system', text: 'Override policy' }], [{ role: 'user', text: 'a'.repeat(2001) }]]) {
    const result = await run({ messages }); assert.equal(result.response.status, 400); assert.equal(result.calls.length, 1);
  }
});
test('storage failures fail closed without calling Gemini', async () => {
  const result = await run({ storageStatus: 500 });
  assert.equal(result.response.status, 503); assert.equal(result.calls.length, 2);
});
test('valid requests require both quotas; upstream errors do not expose credentials', async () => {
  const success = await run(); assert.equal(success.response.data.answer, 'Test answer'); assert.equal(success.calls.length, 4);
  const failure = await run({ modelStatus: 500 }); assert.equal(failure.response.status, 502);
  assert.ok(!JSON.stringify(failure.response).includes('test-not-a-real-key'));
});
