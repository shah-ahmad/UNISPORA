// Explicit integration check. Creates disposable records and a user, then removes them.
// Requires a trusted API key and the ID of the administrator authorizing the test.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const endpoint = process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const project = process.env.APPWRITE_PROJECT_ID || '6a25cb6500103eec5cb3';
const key = process.env.APPWRITE_API_KEY;
const adminId = process.env.ADMIN_TEST_ID;
if (!key || !adminId) throw new Error('Set APPWRITE_API_KEY and ADMIN_TEST_ID.');
const base = '/databases/unispora/collections/';
async function request(path, method = 'GET', body, auth = { 'X-Appwrite-Key': key }) {
  const response = await fetch(endpoint + path, {method,headers:{'Content-Type':'application/json','X-Appwrite-Project':project,...auth},...(body ? {body:JSON.stringify(body)} : {})});
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  return {status:response.status,data};
}
async function must(path, method, body, auth) { const r = await request(path,method,body,auth); if (r.status >= 400) throw new Error(`${path}: ${r.data.message || r.status}`); return r.data; }
const cleanup = [];
let jwt;
async function action(body) {
  const execution = await must('/functions/unispora-admin/executions','POST',{body:JSON.stringify(body),async:false,method:'POST'},{'X-Appwrite-JWT':jwt});
  const data = JSON.parse(execution.responseBody || '{}');
  if (execution.responseStatusCode >= 400) throw new Error(data.message || 'Function failed.');
  return data;
}
try {
  const session = await must('/users/'+adminId+'/sessions','POST',{});
  cleanup.push(() => request('/users/'+adminId+'/sessions/'+session.$id,'DELETE'));
  jwt = (await must('/account/jwts','POST',{}, {'X-Appwrite-Session':session.secret})).jwt;
  const listing = await action({action:'listUsers'});
  assert.ok(Array.isArray(listing.users)); assert.ok(listing.users.every(u => !('password' in u) && !('hash' in u)));
  console.log('PASS: authenticated user listing is sanitized');
  const denied = await request('/functions/unispora-admin/executions','POST',{body:'{"action":"listUsers"}',async:false,method:'POST'},{});
  assert.ok(denied.status >= 400); console.log('PASS: anonymous function access denied');
  const userId = randomUUID();
  await must('/users','POST',{userId,email:`admin-check-${Date.now()}@example.invalid`,password:randomUUID()+'aA9!',name:'Disposable admin integration check'});
  cleanup.push(() => request('/users/'+userId,'DELETE'));
  await must('/users/'+userId+'/prefs','PATCH',{prefs:{role:'consultant'}});
  const testSession = await must('/users/'+userId+'/sessions','POST',{});
  const nonAdmin = await request('/functions/unispora-admin/executions','POST',{body:'{"action":"listUsers"}',async:false,method:'POST'},{'X-Appwrite-Session':testSession.secret});
  assert.ok(nonAdmin.status >= 400); console.log('PASS: consultant function access denied');
  await action({action:'setUserStatus',userId,status:false});
  const blocked = await request('/account','GET',undefined,{'X-Appwrite-Session':testSession.secret});
  assert.ok(blocked.status >= 400); assert.equal((await must('/users/'+userId)).status,false);
  await action({action:'setUserStatus',userId,status:true}); assert.equal((await must('/users/'+userId)).status,true);
  console.log('PASS: blocking denies account access; unblocking restores status');
  const draft = {name:'Disposable draft check',placement:'section',title:'Disposable integration check',body:'Temporary test record',isPublished:false};
  const content = (await action({action:'save',collection:'site_content',data:draft})).result;
  cleanup.push(() => request(base+'site_content/documents/'+content.$id,'DELETE'));
  assert.ok((await request(base+'site_content/documents/'+content.$id,'GET',undefined,{})).status >= 400);
  await action({action:'save',collection:'site_content',documentId:content.$id,data:{...draft,isPublished:true}});
  assert.equal((await request(base+'site_content/documents/'+content.$id,'GET',undefined,{})).status,200);
  await action({action:'save',collection:'site_content',documentId:content.$id,data:draft});
  assert.ok((await request(base+'site_content/documents/'+content.$id,'GET',undefined,{})).status >= 400);
  await action({action:'delete',collection:'site_content',documentId:content.$id});
  console.log('PASS: draft/publish/unpublish permissions and deletion');
  const plan = (await action({action:'save',collection:'premium_plans',data:{name:'Disposable plan',price:0,currency:'EUR',billingInterval:'monthly',status:'draft',features:[]}})).result;
  cleanup.push(() => request(base+'premium_plans/documents/'+plan.$id,'DELETE'));
  cleanup.push(() => request(base+'admin_subscriptions/documents/'+userId,'DELETE'));
  const grant = (await action({action:'grantAccess',data:{userId,planId:plan.$id,status:'active',expiresAt:new Date(Date.now()+86400000).toISOString(),note:'Disposable integration check'}})).result;
  assert.equal(grant.userId,userId);
  assert.ok((await request(base+'admin_subscriptions/documents/'+userId,'GET',undefined,{})).status >= 400);
  await assert.rejects(() => action({action:'delete',collection:'premium_plans',documentId:plan.$id}),/Archive/);
  console.log('PASS: private premium access, referenced-plan protection');
  const logs = await must(base+'admin_activity/documents'); assert.ok(logs.total > 0);
  assert.ok((await request(base+'admin_activity/documents','GET',undefined,{})).status >= 400);
  console.log('PASS: activity log created and private');
} finally {
  let failed = false;
  for (const fn of cleanup.reverse()) { try { const r = await fn(); if (r.status >= 400 && r.status !== 404) failed = true; } catch { failed = true; } }
  if (failed) throw new Error('Test cleanup needs attention.');
  console.log('Temporary records, user, and administrator test session removed.');
}
