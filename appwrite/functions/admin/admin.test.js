import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { validate, ensureManageable } from './index.js';
test('numeric and link fields reject unsafe or invalid values', () => {
  assert.throws(() => validate('universities', {name:'Test',city:'Test',country:'Test',latitude:91,longitude:0}));
  assert.throws(() => validate('site_content', {name:'Test',placement:'section',title:'Test',isPublished:true,buttonUrl:'javascript:alert(1)'}));
  assert.throws(() => validate('premium_plans', {name:'Test',price:-1,currency:'EUR',billingInterval:'monthly',status:'draft'}));
});
test('field allowlist strips injected permissions and admin labels', () => {
  const value = validate('consultants', {name:'Test',labels:['admin'],$permissions:['write("any")']});
  assert.equal(value.name,'Test'); assert.equal(value.labels,undefined); assert.equal(value.$permissions,undefined);
});
test('false publication is valid and preserved', () => {
  assert.equal(validate('site_content',{name:'Test',placement:'section',title:'Test',isPublished:false}).isPublished,false);
});
test('self and all administrators are protected from blocking', () => {
  assert.throws(() => ensureManageable({$id:'me'},{$id:'me',labels:[]}));
  assert.throws(() => ensureManageable({$id:'me'},{$id:'other',labels:['admin']}));
  assert.doesNotThrow(() => ensureManageable({$id:'me'},{$id:'consultant',labels:[]}));
});
async function run(body, user, responses = [], jwt = 'test') {
  const calls = []; const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    calls.push({url,options});
    return new Response(JSON.stringify(calls.length === 1 ? user : responses.shift() || {}), {status:200});
  };
  try { const response = await handler({req:{method:'POST',headers:jwt ? {'x-appwrite-user-jwt':jwt,'x-appwrite-key':'test'} : {},bodyJson:body},res:{json:(data,status=200)=>({data,status})}}); return {response,calls}; }
  finally { globalThis.fetch = original; }
}
const admin = {$id:'admin',status:true,emailVerification:true,labels:['admin']};
test('missing authentication is rejected without a privileged call', async () => {
  const {response,calls} = await run({action:'listUsers'},admin,[],null); assert.equal(response.status,401); assert.equal(calls.length,0);
});
test('consultants, unverified and blocked accounts cannot use admin service', async () => {
  for (const user of [{...admin,labels:[],prefs:{role:'admin'}},{...admin,emailVerification:false},{...admin,status:false}]) {
    const {response,calls} = await run({action:'listUsers'},user); assert.equal(response.status,403); assert.equal(calls.length,1);
  }
});
test('user listing never returns password hashes or security credentials', async () => {
  const {response} = await run({action:'listUsers'},admin,[{total:1,users:[{$id:'user',email:'test@example.test',hash:'secret',password:'secret',labels:[],prefs:{}}]}]);
  assert.equal(response.data.total,1); assert.equal(response.data.users[0].hash,undefined); assert.equal(response.data.users[0].password,undefined);
});
test('published content receives public read only and writes are audited', async () => {
  const {response,calls} = await run({action:'save',collection:'site_content',data:{name:'Test',placement:'section',title:'Test',isPublished:true}},admin,[{},{$id:'new'},{}]);
  assert.equal(response.status,200); assert.deepEqual(JSON.parse(calls[2].options.body).permissions,['read("any")']);
  assert.equal(JSON.parse(calls[1].options.body).data.result,'pending'); assert.equal(JSON.parse(calls[3].options.body).data.result,'completed');
});
test('audit records cannot be edited through generic catalog actions', async () => {
  const {response,calls} = await run({action:'delete',collection:'admin_activity',documentId:'event'},admin); assert.equal(response.status,400); assert.equal(calls.length,1);
});
